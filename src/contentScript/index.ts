chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "replaceSelection") {
    try {
      replaceSelectedText(request.text);
    } catch (e) {
      console.log("error replacing text")
      console.log(e);
    }
  }

  if (request.action === "executeFunctionAndReturnResult") {
    const result = getCurrentSelectionText(); // Assuming this function returns a value
    sendResponse({ result: result });
    return true; // Indicates you wish to send a response asynchronously (important for Chrome v80+)
  }
});

function getCurrentSelectionText() {
  const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
  const isContentEditable = activeElement?.isContentEditable;

  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const text = activeElement.value;
    if (start === null || end === null || text === null) return;
    return text.slice(start, end);
  } else if (isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return range.toString();
    }
  }
  return null;
}


function replaceSelectedText(replacementText:string) {
  const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;

  if (!activeElement) return;
  const isInTextField = activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT';
  const isContentEditable = activeElement.isContentEditable;

  if (isInTextField) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const text = activeElement.value;
    if (start === null || end === null || text === null) return;
    activeElement.value = text.slice(0, start) + replacementText + text.slice(end);
    activeElement.setSelectionRange(start + replacementText.length, start + replacementText.length);
  } else if (isContentEditable) {
    const selection = window.getSelection();
    if (!selection) return;
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(replacementText));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } else {
    // For normal page content
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(replacementText));
    }
  }
}

function someFunctionDefinedInContentScript() {
  // Do something...
  return "lol";
}