// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, languages, Selection, StatusBarAlignment, window, workspace} from 'vscode';
import { sendCodeToCopilot, turnOffFauxpilot, turnOnFauxpilot } from './Commands';
import { FauxpilotCompletionProvider } from './FauxpilotCompletionProvider';
import * as vscode from 'vscode';

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
		commands.registerCommand('extension.sendCodeToCopilot', async () => {
            const editor = window.activeTextEditor;
            if (editor) {
                const { start, end } = editor.selection;
              	const selectedCode = editor.document.getText(editor.selection);
				const suggestedCode = await sendCodeToCopilot(start, end);	
                await vscode.commands.executeCommand('extension.showSuggestions', selectedCode, suggestedCode);
            }

        }),
		vscode.commands.registerCommand('extension.showSuggestions', (selectedCode: string, suggestedCode: string) => {
            // Get the active text editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
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
        }),

		languages.registerInlineCompletionItemProvider(
			{ pattern: "**" }, new FauxpilotCompletionProvider(statusBar)
		),

		
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


function applySuggestions(originalCode: string, suggestions: string): string {
    // Logic to apply suggestions and return modified code
    // For now, let's simply join the suggestions into the original code
    return originalCode + '\n' + suggestions + '\n';
}

// function getWebViewContent(selectedCode: string, suggestedCode: string): string {


// 	const modifiedCode = applySuggestions(selectedCode, suggestedCode)
//     // Compare the original and modified lines to find the added lines
	

    

//     // HTML and CSS for the webview
//     const html = `
//         <html>
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <link rel="stylesheet" href="./reset.css">
//                 <link rel="stylesheet" href="./style.css">
//                 <title>Webview Content</title>
//                 <style>
//                     .container {
//                         display: flex;
//                     }
//                     .panel {
//                         width: 100%;
//                         padding: 20px;
//                     }
//                     .new-line {
//                         color: green;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="panel">
//                         <h2>Copilot response</h2>
//                         <pre>${modifiedCode}</pre>
//                     </div>
//                 </div>
//             </body>
//         </html>
//     `;

//     return html;
// }

// function formatModifiedCode(modifiedLines: string[]): string {
//     // Prefix new lines with a green star
//     const formattedLines = modifiedLines.map(line => `<span class="new-line">★ </span>${escapeHtml(line)}`);

//     // Join the lines back into a string
//     return formattedLines.join('<br>');
// }

function getWebViewContent(selectedCode: string, suggestedCode: string): string {
    // HTML and CSS for the webview
    const html = `
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="./reset.css">
                <link rel="stylesheet" href="./vscode.css">
                <title>Webview Content</title>
            </head>
            <style>
            .marker {
                background-color: #0cf01431; /* Light green background for suggested lines */
                padding: 2px;
                border-radius: 2px;
                font-family: var(--vscode-editor-font-family); /* Specify your desired font family */
                font-size: 12px; /* Adjust font size as needed */
                /* Add any other styles specific to marker (suggested) lines */
            
            }
            .code-line {
                margin: 5px 0;
            }
            </style>
            <body>
                <div class="code-container">
                    <h2>Copilot Suggestions</h2>
                    <div class="code-line">${escapeHtml(selectedCode)}</div>
                    <div class="code-line marker">${escapeHtml(suggestedCode)}</div>
                </div>
            </body>
        </html>
    `;
    return html;
}


function formatCode(selectedLines: string[], suggestedLines: string[]): string {
    let formattedCode = '';

    selectedLines.forEach((line, index) => {
        const lineNumber = index + 1;
        formattedCode += `<div class="code-line">${lineNumber}. ${escapeHtml(line)}</div>`;

        if (suggestedLines.includes(lineNumber.toString())) {
            const suggestedLine = suggestedLines[suggestedLines.indexOf(lineNumber.toString())];
            formattedCode += `<div class="code-line marker">${escapeHtml(suggestedLine)}</div>`;
        }
    });

    return formattedCode;
}




function escapeHtml(html: string): string {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
