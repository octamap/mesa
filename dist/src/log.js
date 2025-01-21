import chalk from 'chalk';
export default function log(text, type) {
    const methods = { "warn": console.warn, "error": console.error };
    const method = type ? methods[type] : console.log;
    method(`${chalk.blueBright(`[mesa]`)} ${text}`);
}
