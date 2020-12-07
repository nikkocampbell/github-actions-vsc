import * as vscode from 'vscode';
import GithubActionsProvider from './githubActionsProvider';
import ActionsLogProvider from './actionsLogProvider';
import * as AxiosClient from './axiosClient';

export async function activate(context: vscode.ExtensionContext) {
	context.globalState.setKeysForSync(['gh-actions/apiKey']);

	let apiKey = context.globalState.get<string>('gh-actions/apiKey');

	if (!apiKey) {
		apiKey = await vscode.window.showInputBox({
			prompt: "Enter a GitHub personal access token",
			placeHolder: "Token",
			ignoreFocusOut: true
		});

		context.globalState.update("gh-actions/apiKey", apiKey);
	}

	AxiosClient.client(apiKey);

	const githubActionsProvider = new GithubActionsProvider();

	vscode.window.registerTreeDataProvider(
		'githubActions',
		githubActionsProvider
	);
	vscode.commands.registerCommand('githubActions.refreshEntries', () =>
		githubActionsProvider.refresh()
	);
	vscode.commands.registerCommand('githubActions.viewLogs', (actionJob) =>
		actionJob.viewLogs()
	);

	const myProvider = new ActionsLogProvider();
	vscode.workspace.registerTextDocumentContentProvider(
		'githubActions.logProvider',
		myProvider
	);
}

export function deactivate() {}
