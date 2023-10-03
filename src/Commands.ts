import { ConfigurationTarget, Position, Range, StatusBarAlignment, window, workspace } from "vscode";
import { FauxpilotCompletionProvider } from "./FauxpilotCompletionProvider";

const configuration = workspace.getConfiguration();
const target = ConfigurationTarget.Global;

function setExtensionStatus(enabled: boolean) {
    console.debug("Setting fauxpilot state to", enabled);
    configuration.update('fauxpilot.enabled', enabled, target, false).then(console.error);
}

export type Command = { command: string, callback: (...args: any[]) => any, thisArg?: any };

export const turnOnFauxpilot: Command = {
    command: "fauxpilot.enable",
    callback: () => setExtensionStatus(true)
};

export const turnOffFauxpilot: Command = {
    command: "fauxpilot.disable",
    callback: () => setExtensionStatus(false)
};

// export async function sendCodeToCopilot(startPosition: Position, endPosition: Position): Promise<void> {
//     const selectedCode = window.activeTextEditor?.document.getText(new Range(startPosition, endPosition));
//     if (selectedCode) {
//         const statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
//         statusBar.text = "$(light-bulb)";
//         statusBar.tooltip = `Fauxpilot - Ready`;
//         const provider = new FauxpilotCompletionProvider(statusBar);
//         await provider.sendCustomPromptToServer(selectedCode, endPosition);
//     }
// };

export async function sendCodeToCopilot(startPosition: Position, endPosition: Position): Promise<string> {
    const selectedCode = window.activeTextEditor?.document.getText(new Range(startPosition, endPosition));
    // For now, let's assume suggestions is an array of strings returned by the server
    if (selectedCode) {
        const statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
        statusBar.text = "$(light-bulb)";
        statusBar.tooltip = `Fauxpilot - Ready`;
        const provider = new FauxpilotCompletionProvider(statusBar);
        const response_string = await provider.sendCustomPromptToServer(selectedCode);
        if (typeof response_string === 'string' ){
            console.debug("Commands.ts: respons.string", response_string);
            return response_string;
        }else{
            return "Not a response";
        }
    }
    return "Not a response"
};



