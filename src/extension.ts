// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, languages, Selection, StatusBarAlignment, window, workspace} from 'vscode';
import { sendCodeToCopilot, turnOffFauxpilot, turnOnFauxpilot } from './Commands';
import { FauxpilotCompletionProvider } from './FauxpilotCompletionProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.debug("Registering Fauxpilot provider", new Date());

	const statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
	statusBar.text = "$(light-bulb)";
	statusBar.tooltip = `Fauxpilot - Ready`;

	const statusUpdateCallback = (callback: any, showIcon: boolean) => async () => {
		await callback();
		if (showIcon) {
			statusBar.show();
		} else {
			statusBar.hide();
		}
	};

	context.subscriptions.push(
		languages.registerInlineCompletionItemProvider(
			{ pattern: "**" }, new FauxpilotCompletionProvider(statusBar)
		),
		commands.registerCommand('extension.sendCodeToCopilot', async () => {
            const editor = window.activeTextEditor;
            if (editor) {
                const { start, end } = editor.selection;
                await sendCodeToCopilot(start, end);
            }
        }),
		commands.registerCommand(turnOnFauxpilot.command, statusUpdateCallback(turnOnFauxpilot.callback, true)),
		commands.registerCommand(turnOffFauxpilot.command, statusUpdateCallback(turnOffFauxpilot.callback, false)),
		statusBar
	);

	if (workspace.getConfiguration('fauxpilot').get("enabled")) {
		statusBar.show();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.debug("Deactivating Fauxpilot provider", new Date());
}