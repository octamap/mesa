import chalk  from 'chalk';

export default function logText(text: string) {
    return `${chalk.blueBright(`[mesa]`)} ${text}`
}