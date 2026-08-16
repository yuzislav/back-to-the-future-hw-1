class TableFormatter {
  displayResults(results) {
    if (results.length === 0) {
      console.log('No links found.');
      return;
    }

    const table = [];
    const maxFileWidth = Math.max(
      'MD File'.length,
      ...results.map(r => r.mdFile.length)
    );
    const maxLinkWidth = Math.max(
      'Link'.length,
      ...results.map(r => r.link.length)
    );

    // Header
    const header = [
      'MD File'.padEnd(maxFileWidth),
      'Link'.padEnd(maxLinkWidth),
      'Status'
    ].join(' | ');

    console.log(header);
    console.log('-'.repeat(header.length));

    // Rows
    for (const result of results) {
      const status = result.isAlive
        ? this.colorize('✓ Live', 'green')
        : this.colorize('✗ Dead', 'red');

      const row = [
        result.mdFile.padEnd(maxFileWidth),
        result.link.padEnd(maxLinkWidth),
        status
      ].join(' | ');

      console.log(row);
    }

    // Summary
    console.log('-'.repeat(header.length));
    const deadCount = results.filter(r => !r.isAlive).length;
    const liveCount = results.length - deadCount;
    console.log(`Total: ${results.length} | ${this.colorize(`Live: ${liveCount}`, 'green')} | ${this.colorize(`Dead: ${deadCount}`, 'red')}`);
  }

  colorize(text, color) {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      reset: '\x1b[0m'
    };

    return `${colors[color]}${text}${colors.reset}`;
  }
}

module.exports = TableFormatter;
