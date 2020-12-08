import * as vscode from 'vscode';
import { GithubActionsProvider, ActionJob } from './githubActionsProvider';
import ActionsLogProvider from './actionsLogProvider';
import * as AxiosClient from './axiosClient';
import { exec } from 'child_process';
import { URL } from 'url';

export async function activate(context: vscode.ExtensionContext) {
	context.globalState.setKeysForSync(['gh-actions/apiKey']);

	let apiKey = context.globalState.get<string>('gh-actions/apiKey');

	if (!apiKey) {

		const yesNo = await vscode.window.showQuickPick(['Yes', 'No'], {
			ignoreFocusOut: true,
			canPickMany: false,
			placeHolder: 'GitHub Actions VS Code needs a personal access token. Go to GitHub now?'
		});

		if (yesNo === 'Yes') {
			vscode.env.openExternal(vscode.Uri.parse(
				'https://github.com/settings/tokens/new?description=GitHub%20Actions%20VS%20Code&scopes=repo,workflow'
			));
		}

		apiKey = await vscode.window.showInputBox({
			prompt: 'Enter a GitHub personal access token',
			placeHolder: 'Token',
			ignoreFocusOut: true
		});

		context.globalState.update("gh-actions/apiKey", apiKey);
	}

	const folders = vscode.workspace.workspaceFolders;

	if (!folders || !folders.length) {return;};

	const [org, repo] = await new Promise((resolve, reject) => {
		exec(`cd ${folders[0].uri.fsPath} && git remote -v`, (err, stdout, stderr) => {
			if (err || stderr) {
				return reject(err);
			}

			const lines = stdout.split('\n');
			const origin = lines.find(l => l.startsWith('origin'));

			if (!origin) {
				return reject('No remote repos found');
			}
			const [_, url] = origin.split(/\s/);

			let org:string, repo:string;
			if (url.startsWith('git@')) {
				const [_, location] = url.split(':');
				[org, repo] = location.split('/');
			} else {
				const uri = new URL(url);
				[org, repo] = uri.pathname.split('/').splice(1);
			}

			resolve([
				org,
				repo.split('.').slice(0,-1).join('.')
			]);
		});
	});

	AxiosClient.client(apiKey);

	const githubActionsProvider = new GithubActionsProvider(org, repo);

	vscode.window.registerTreeDataProvider(
		'githubActions',
		githubActionsProvider
	);
	vscode.commands.registerCommand('githubActions.refreshEntries', () =>
		githubActionsProvider.refresh()
	);
	vscode.commands.registerCommand('githubActions.viewLogs', (actionJob:ActionJob) =>
		actionJob.viewLogs()
	);
	vscode.commands.registerCommand('githubActions.openJobInGithub', (actionJob:ActionJob) =>
		actionJob.openInGithub()
	);

	const myProvider = new ActionsLogProvider();
	vscode.workspace.registerTextDocumentContentProvider(
		'githubActions.logProvider',
		myProvider
	);
}

export function deactivate() {}
