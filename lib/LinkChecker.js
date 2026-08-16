const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class LinkChecker {
  constructor(folderPath) {
    this.folderPath = folderPath;
    this.results = [];
  }

  async checkAllLinks() {
    const mdFiles = this.findMarkdownFiles(this.folderPath);

    for (const file of mdFiles) {
      const relativeFile = path.relative(this.folderPath, file);
      const content = fs.readFileSync(file, 'utf-8');
      const links = this.extractLinks(content);

      for (const link of links) {
        const result = await this.checkLink(link, file);
        this.results.push({
          mdFile: relativeFile,
          link: link,
          isAlive: result.isAlive,
          statusCode: result.statusCode,
          type: result.type
        });
      }
    }

    return this.results;
  }

  findMarkdownFiles(folderPath) {
    let files = [];
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
      const fullPath = path.join(folderPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files = files.concat(this.findMarkdownFiles(fullPath));
      } else if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  extractLinks(content) {
    const links = new Set();

    // Match markdown links: [text](url) and [text](url "title")
    const mdLinkRegex = /\[(?:[^\[\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = mdLinkRegex.exec(content)) !== null) {
      const url = match[1].split(/\s+(?=["'])/)[0]; // Remove title if present

      // Skip anchor-only links
      if (url.startsWith('#')) {
        continue;
      }

      links.add(url);
    }

    return Array.from(links);
  }

  async checkLink(link, filePath) {
    // Handle HTTP/HTTPS links
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return await this.checkHttpLink(link);
    }

    // Handle file links (relative and absolute)
    const isAlive = this.checkFileLink(link, filePath);
    return { isAlive, statusCode: isAlive ? 'exists' : 'not-found', type: 'file' };
  }

  checkFileLink(link, filePath) {
    // Remove anchor suffix if present
    const linkWithoutAnchor = link.split('#')[0];

    // Decode URL-encoded link
    const decodedLink = decodeURIComponent(linkWithoutAnchor);

    let resolvedPath;

    if (path.isAbsolute(decodedLink)) {
      // Absolute path - relative to folder root
      resolvedPath = path.join(this.folderPath, decodedLink);
    } else {
      // Relative path - relative to the markdown file
      const fileDir = path.dirname(filePath);
      resolvedPath = path.resolve(fileDir, decodedLink);
    }

    return fs.existsSync(resolvedPath);
  }

  async checkHttpLink(link) {
    const maxRetries = 3;
    const timeout = 5000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.makeHeadRequest(link, timeout);

        // If HEAD returns 405 Method Not Allowed, try GET
        if (result.statusCode === 405) {
          try {
            const getResult = await this.makeGetRequest(link, timeout);
            return {
              isAlive: getResult.isAlive,
              statusCode: getResult.statusCode,
              type: 'http'
            };
          } catch (getError) {
            return {
              isAlive: false,
              statusCode: getError.statusCode || getError.code || 'error',
              type: 'http'
            };
          }
        }

        return {
          isAlive: result.isAlive,
          statusCode: result.statusCode,
          type: 'http'
        };
      } catch (error) {
        // Check if error is retriable
        const isRetriable =
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          (error.statusCode >= 500 && error.statusCode < 600);

        if (!isRetriable || attempt === maxRetries - 1) {
          const statusCode = error.statusCode || error.code || 'error';
          return {
            isAlive: false,
            statusCode: statusCode,
            type: 'http'
          };
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      isAlive: false,
      statusCode: 'failed',
      type: 'http'
    };
  }

  makeHeadRequest(url, timeout) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.request(url, { method: 'HEAD', timeout }, (res) => {
        request.destroy();

        // Accept 2xx and 3xx status codes as alive
        const isAlive = res.statusCode >= 200 && res.statusCode < 400;
        const result = {
          isAlive: isAlive,
          statusCode: res.statusCode
        };

        // For 405 Method Not Allowed, we'll handle it in checkHttpLink with GET fallback
        if (res.statusCode === 405) {
          reject(result);
        } else {
          resolve(result);
        }
      });

      request.on('timeout', () => {
        request.destroy();
        const error = new Error('Request timeout');
        error.code = 'ETIMEDOUT';
        reject(error);
      });

      request.on('error', (error) => {
        request.destroy();
        reject(error);
      });

      request.end();
    });
  }

  makeGetRequest(url, timeout) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.request(url, { method: 'GET', timeout }, (res) => {
        request.destroy();

        // Accept 2xx and 3xx status codes as alive
        const isAlive = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          isAlive: isAlive,
          statusCode: res.statusCode
        });
      });

      request.on('timeout', () => {
        request.destroy();
        const error = new Error('Request timeout');
        error.code = 'ETIMEDOUT';
        reject(error);
      });

      request.on('error', (error) => {
        request.destroy();
        reject(error);
      });

      request.end();
    });
  }
}

module.exports = LinkChecker;
