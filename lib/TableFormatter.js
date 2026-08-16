class TableFormatter {
  constructor() {
    this.MAX_WIDTH = 120;
    this.COLUMN_WIDTHS = {
      mdFile: 25,
      link: 70,
      status: 20
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
    const header = this.formatRow('MD File', 'Link', 'Status');
    console.log(header);
    this.printSeparator();
  }

  printSeparator() {
    console.log('─'.repeat(this.MAX_WIDTH));
  }

  formatRow(mdFile, link, status) {
    const parts = [
      mdFile.substring(0, this.COLUMN_WIDTHS.mdFile).padEnd(this.COLUMN_WIDTHS.mdFile),
      link.substring(0, this.COLUMN_WIDTHS.link).padEnd(this.COLUMN_WIDTHS.link),
      status.substring(0, this.COLUMN_WIDTHS.status).padEnd(this.COLUMN_WIDTHS.status)
    ];
    return parts.join(' | ');
  }

  printRow(result) {
    const mdFile = result.mdFile;
    const link = result.link;
    const status = this.formatStatus(result);

    // Calculate how many lines we need
    const mdFileLines = this.wrapText(mdFile, this.COLUMN_WIDTHS.mdFile);
    const linkLines = this.wrapText(link, this.COLUMN_WIDTHS.link);
    const statusLines = this.wrapText(status, this.COLUMN_WIDTHS.status);

    const maxLines = Math.max(mdFileLines.length, linkLines.length, statusLines.length);

    for (let i = 0; i < maxLines; i++) {
      const mdFileLine = mdFileLines[i] || '';
      const linkLine = linkLines[i] || '';
      const statusLine = statusLines[i] || '';

      const row = [
        mdFileLine.padEnd(this.COLUMN_WIDTHS.mdFile),
        linkLine.padEnd(this.COLUMN_WIDTHS.link),
        statusLine.padEnd(this.COLUMN_WIDTHS.status)
      ].join(' | ');

      console.log(row);
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

  formatStatus(result) {
    const baseStatus = result.isAlive ? '✓ Live' : '✗ Dead';
    const statusCode = result.statusCode;
    const type = result.type;

    let fullStatus = baseStatus;

    if (type === 'http' && statusCode !== 'exists' && statusCode !== 'not-found') {
      fullStatus += ` [${statusCode}]`;
    }

    // Apply color
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
    const summary = `Total: ${results.length} | Live: ${liveCount} | Dead: ${deadCount}`;
    console.log(summary);
  }
}

module.exports = TableFormatter;
