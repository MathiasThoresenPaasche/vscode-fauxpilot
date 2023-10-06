// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, languages, Selection, StatusBarAlignment, window, workspace} from 'vscode';
import { sendCodeToCopilot, turnOffFauxpilot, turnOnFauxpilot } from './Commands';
import { FauxpilotCompletionProvider } from './FauxpilotCompletionProvider';
import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
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

	

    let previousEditor: vscode.TextEditor | undefined;

	context.subscriptions.push(
		commands.registerCommand('extension.sendCodeToCopilot', async () => {
            const editor = window.activeTextEditor;
            previousEditor = window.activeTextEditor;
            if (editor) {
                const { start, end } = editor.selection;
              	const selectedCode = editor.document.getText(editor.selection);
				const suggestedCode = await sendCodeToCopilot(start, end);	
                await vscode.commands.executeCommand('extension.showSuggestions', selectedCode, suggestedCode);
            }

        }),
		vscode.commands.registerCommand('extension.showSuggestions', (selectedCode: string, suggestedCode: string) => {
            // Get the active text editor
            // const editor = vscode.window.activeTextEditor;
            if (!previousEditor) {
                vscode.window.showErrorMessage('No active editor found.');
                return;
            }

            // Create a webview panel
            const panel = vscode.window.createWebviewPanel(
                'suggestionsPanel',
                'Code Suggestions',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true
                }
            );

            // Construct the content for the webview
            
            // const modifiedCode = applySuggestions(selectedCode, suggestedCode);

            panel.webview.html = getWebViewContent(selectedCode, suggestedCode);
            panel.webview.onDidReceiveMessage((message) => {
                switch (message.command) {
                    case 'insertSuggestedCode':
                        vscode.commands.executeCommand('extension.insertSuggestedCode', suggestedCode);
                        console.debug("Inserted suggested code into active window");
                        break;
                }
            }, undefined, context.subscriptions);
        }),

		languages.registerInlineCompletionItemProvider(
			{ pattern: "**" }, new FauxpilotCompletionProvider(statusBar)
		),
        commands.registerCommand('extension.insertSuggestedCode', (suggestedCode: string) => {
            // const editor = vscode.window.activeTextEditor;
            if (previousEditor != undefined) {
                const editor = previousEditor;
                editor.edit((editBuilder) => {
                    // Get the selection range or the end of the document
                    const position = editor.selection.isEmpty ? editor.selection.active : editor.selection.end;
                    // Insert the suggested code at the cursor position
                    editBuilder.insert(position, suggestedCode);
                });
            }else{
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.edit((editBuilder) => {
                        // Get the selection range or the end of the document
                        const position = editor.selection.isEmpty ? editor.selection.active : editor.selection.end;
                        // Insert the suggested code at the cursor position
                        editBuilder.insert(position, suggestedCode);
                    });

                }
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



function loadFileContent(filePath: string): string {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return '';
    }
}

function getWebViewContent(selectedCode: string, suggestedCode: string): string {
    // Load HTML and JavaScript files
    const htmlFilePath = path.join("/home/mtp/.vscode/extensions/vscode-fauxpilot", 'src', 'webview', 'webview.html');
    const jsFilePath = path.join("/home/mtp/.vscode/extensions/vscode-fauxpilot", 'src', 'webview', 'webview.js');
    const htmlContent = loadFileContent(htmlFilePath);
    const jsContent = loadFileContent(jsFilePath);


    
    // Replace placeholders in the HTML content with actual code
    const modifiedHtmlContent = htmlContent
        .replace('${escapeHtml(selectedCode)}', escapeHtml(selectedCode))
        .replace('${escapeHtml(suggestedCode)}', escapeHtml(suggestedCode));
    const modifiedjsContent = jsContent
        .replace('${escapeHtml(selectedCode)}', escapeHtml(selectedCode))
        .replace('${escapeHtml(suggestedCode)}', escapeHtml(suggestedCode));
        // Combine HTML content with JavaScript content

    const finalHtmlContent = `
        ${modifiedHtmlContent}
        <script>
            ${modifiedjsContent}
        </script>
    `;

    return finalHtmlContent;
}

function escapeHtml(html: string): string {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
