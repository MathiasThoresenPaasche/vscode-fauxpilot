document.getElementById('copyButton').addEventListener('click', function() {
    const suggestedCode = document.getElementById('suggestedCode').innerText;
    const textarea = document.createElement('textarea');
    textarea.value = suggestedCode;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    // alert('Copied to clipboard!');
});

document.getElementById('insertButton').addEventListener('click', function() {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
        command: 'insertSuggestedCode',
        text: " "
    });
});

document.getElementById('res').innerText = ${escapeHtml(selectedCode)} + ${escapeHtml(suggestedCode)};


