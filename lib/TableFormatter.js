class TableFormatter {
  constructor() {
    this.MAX_WIDTH = 150;
    this.COLUMN_WIDTHS = {
      mdFile: 32,
      link: 77,
      status: 35
    };
  }

  displayResults(results) {
    if (results.length === 0) {
      console.log('No links found.');
      return;
    }

    this.printHeader();

    for (const result of results) {
      this.printRow(result);
    }

    this.printSeparator();
    this.printSummary(results);
  }

  printHeader() {
    const mdFileHeader = 'MD File'.padEnd(this.COLUMN_WIDTHS.mdFile);
    const linkHeader = 'Link'.padEnd(this.COLUMN_WIDTHS.link);
    const statusHeader = 'Status'.padEnd(this.COLUMN_WIDTHS.status);
    console.log(`${mdFileHeader} | ${linkHeader} | ${statusHeader}`);
    this.printSeparator();
  }

  printSeparator() {
    console.log('─'.repeat(this.MAX_WIDTH));
  }

  printRow(result) {
    const mdFile = result.mdFile;
    const link = result.link;
    const status = this.formatStatus(result);

    // Wrap text for each column
    const mdFileLines = this.wrapText(mdFile, this.COLUMN_WIDTHS.mdFile);
    const linkLines = this.wrapText(link, this.COLUMN_WIDTHS.link);
    const statusLines = this.wrapText(status, this.COLUMN_WIDTHS.status);

    const maxLines = Math.max(mdFileLines.length, linkLines.length, statusLines.length);

    for (let i = 0; i < maxLines; i++) {
      const mdFileLine = mdFileLines[i] || '';
      const linkLine = linkLines[i] || '';
      const statusLine = statusLines[i] || '';

      const paddedMdFile = mdFileLine.padEnd(this.COLUMN_WIDTHS.mdFile);
      const paddedLink = linkLine.padEnd(this.COLUMN_WIDTHS.link);
      const paddedStatus = this.padStatusLine(statusLine, this.COLUMN_WIDTHS.status);

      console.log(`${paddedMdFile} | ${paddedLink} | ${paddedStatus}`);
    }
  }

  wrapText(text, width) {
    if (!text || width <= 0) return [''];

    const lines = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= width) {
        lines.push(remaining);
        break;
      }

      // Try to break at word boundary
      let breakPoint = width;
      for (let i = width; i > 0; i--) {
        if (remaining[i] === ' ' || remaining[i] === '/' || remaining[i] === '-') {
          breakPoint = i;
          break;
        }
      }

      lines.push(remaining.substring(0, breakPoint).trimEnd());
      remaining = remaining.substring(breakPoint).trimStart();
    }

    return lines;
  }

  padStatusLine(statusLine, width) {
    // Status line contains ANSI color codes, need to account for them
    const ansiRegex = /\x1b\[[0-9;]*m/g;
    const cleanedLine = statusLine.replace(ansiRegex, '');
    const padding = Math.max(0, width - cleanedLine.length);
    return statusLine + ' '.repeat(padding);
  }

  formatStatus(result) {
    const baseStatus = result.isAlive ? '✓ Live' : '✗ Dead';

    let fullStatus = baseStatus;

    // Add status code if available and relevant
    if (result.statusCode !== 'exists' && result.statusCode !== 'not-found') {
      fullStatus += ` [${result.statusCode}]`;
    }

    // Apply color only to status
    if (result.isAlive) {
      return this.colorize(fullStatus, 'green');
    } else {
      return this.colorize(fullStatus, 'red');
    }
  }

  colorize(text, color) {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      reset: '\x1b[0m'
    };

    return `${colors[color]}${text}${colors.reset}`;
  }

  printSummary(results) {
    const deadCount = results.filter(r => !r.isAlive).length;
    const liveCount = results.length - deadCount;
    const summaryText = `Total: ${results.length} | Live: ${liveCount} | Dead: ${deadCount}`;
    console.log(summaryText);
  }
}

module.exports = TableFormatter;
