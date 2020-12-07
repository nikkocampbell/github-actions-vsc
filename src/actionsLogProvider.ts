import * as vscode from 'vscode';
import * as AxiosClient from './axiosClient';

export default class ActionsLogProvider implements vscode.TextDocumentContentProvider {
  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const [organization, repo, jobId] = uri.path.split('/');

    const { data } = await AxiosClient.client().get(`https://api.github.com/repos/${organization}/${repo}/actions/jobs/${jobId}/logs`);
    return data;
  }
}
