import * as vscode from 'vscode';
import * as AxiosClient from './axiosClient';

const organization = '';
const repo = '';

export default class GithubActionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      return Promise.resolve([
        new ActionGroup('Running', 'in_progress'),
        new ActionGroup('Successful', 'success'),
        new ActionGroup('Failed', 'failure'),
      ]);
    } else {
      if (element instanceof ActionGroup) {
          const { data } = await AxiosClient.client().get(`/repos/${organization}/${repo}/actions/runs?status=${element.checkStatus}`);

          return data.workflow_runs
            .slice(0, 10)
            .map((run: ActionRun, i: Number) => new ActionRun(run, i === 0));
      } else if (element instanceof ActionRun) {
        const { data } = await AxiosClient.client().get(element.run.jobs_url);
        return data.jobs.map((job: any) => new ActionJob(job));
      }
    }

    return Promise.reject();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class ActionGroup extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly checkStatus: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.checkStatus = checkStatus;
  }
}

class ActionRun extends vscode.TreeItem {
  constructor(
    public readonly run: any,
    public readonly expanded: boolean = true
  ) {
    super(run.name, expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
    this.run = run;
    this.description = run.head_commit.message;
  }
}

class ActionJob extends vscode.TreeItem {
  constructor(public readonly job: any) {
    super(job.name, vscode.TreeItemCollapsibleState.None);
    this.job = job;
    this.contextValue = "actionJob";

    if (job.status !== "in_progress") {
      const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
      const durationMinutes = Math.floor(duration / 60000);
      const durationSeconds = Math.floor(duration / 1000) % 60;
      this.description = `Completed in ${durationMinutes}m ${durationSeconds}s`;
    } else {
      this.description = `Running...`;
    }
  }

  async viewLogs(){
    let uri = vscode.Uri.parse(`githubActions.logProvider:${organization}/${repo}/${this.job.id}`);
    let doc = await vscode.workspace.openTextDocument(uri);
    vscode.window.showTextDocument(doc, { preview: false });
  }
}
