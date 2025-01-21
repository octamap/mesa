import chalk from 'chalk';
export default function logText(text) {
    return `${chalk.blueBright(`[mesa]`)} ${text}`;
}
