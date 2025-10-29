import { Plugin, TFolder } from 'obsidian';
import { FileScanner } from './scanner';
import { CleanFilesModal } from './ui';
import { CleanFilesSettingTab } from './settings';
import { CleanFilesSettings, DEFAULT_SETTINGS } from './types';

/**
 * Clean Files 插件主类
 */
export default class CleanFilesPlugin extends Plugin {
    private scanner: FileScanner;
    settings: CleanFilesSettings;

    async onload() {
        console.log('加载 Clean Files 插件');

        // 加载设置
        await this.loadSettings();

        // 初始化文件扫描器
        const vaultPath = (this.app.vault.adapter as any).basePath || '';
        this.scanner = new FileScanner(this.app, vaultPath, this.settings);

        // 添加设置页面
        this.addSettingTab(new CleanFilesSettingTab(this.app, this));

        // 添加命令
        this.addCommand({
            id: 'open-clean-files',
            name: '打开清理文件界面',
            callback: () => {
                this.openCleanFilesModal();
            }
        });

        // 添加侧边栏图标
        this.addRibbonIcon('trash-2', '清理文件', () => {
            this.openCleanFilesModal();
        });

        // 添加到命令面板
        this.addCommand({
            id: 'scan-clean-files',
            name: '扫描需要清理的文件',
            callback: () => {
                this.openCleanFilesModal();
            }
        });

        // 添加设置命令
        this.addCommand({
            id: 'open-clean-files-settings',
            name: '打开清理文件设置',
            callback: () => {
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById(this.manifest.id);
            }
        });
    }

    onunload() {
        console.log('卸载 Clean Files 插件');
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        await this.saveData(this.settings);
        // 更新扫描器设置
        if (this.scanner) {
            this.scanner.updateSettings(this.settings);
        }
    }

    /**
     * 重置设置
     */
    async resetSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        await this.saveSettings();
    }

    /**
     * 打开清理文件模态框
     */
    private openCleanFilesModal() {
        const modal = new CleanFilesModal(this.app, this.scanner);
        modal.open();
    }
}