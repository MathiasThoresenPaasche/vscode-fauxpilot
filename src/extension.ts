// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages } from 'vscode';
import { FauxpilotCompletionProvider } from './FauxpilotCompletionProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.debug("Registering Fauxpilot provider", new Date());
	context.subscriptions.push(
		languages.registerInlineCompletionItemProvider(
			{ pattern: "**", scheme: 'untitled' }, new FauxpilotCompletionProvider()
		)
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.debug("Deactivating Fauxpilot provider", new Date());
}