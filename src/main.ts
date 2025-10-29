import { Plugin, TFolder } from 'obsidian';
import { FileScanner } from './scanner';
import { CleanFilesModal } from './ui';
import { CleanFilesSettingTab } from './settings';
import { CleanFilesSettings, DEFAULT_SETTINGS } from './types';
import { I18nManager } from './i18n/I18nManager';

/**
 * Clean Files 插件主类
 */
export default class CleanFilesPlugin extends Plugin {
    private scanner: FileScanner;
    private i18nManager: I18nManager;
    settings: CleanFilesSettings;

    async onload() {
        console.log('加载 Clean Files 插件');

        // 加载设置
        await this.loadSettings();

        // 初始化多语言管理器
        this.i18nManager = new I18nManager(this.app, this.settings.language);

        // 初始化文件扫描器
        const vaultPath = (this.app.vault.adapter as any).basePath || '';
        this.scanner = new FileScanner(this.app, vaultPath, this.settings);

        // 添加设置页面
        this.addSettingTab(new CleanFilesSettingTab(this.app, this, this.i18nManager));

        // 添加命令
        this.addCommand({
            id: 'open-clean-files',
            name: this.i18nManager.t('ui.title'),
            callback: () => {
                this.openCleanFilesModal();
            }
        });

        // 添加侧边栏图标
        this.addRibbonIcon('trash-2', this.i18nManager.t('ui.title'), () => {
            this.openCleanFilesModal();
        });

        // 添加到命令面板
        this.addCommand({
            id: 'scan-clean-files',
            name: this.i18nManager.t('messages.scan_started'),
            callback: () => {
                this.openCleanFilesModal();
            }
        });

        // 添加设置命令
        this.addCommand({
            id: 'open-clean-files-settings',
            name: this.i18nManager.t('settings.title'),
            callback: () => {
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById(this.manifest.id);
            }
        });
    }

    onunload() {
        console.log('卸载 Clean Files 插件');
        
        // 清理多语言管理器
        if (this.i18nManager) {
            this.i18nManager.destroy();
        }
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
        
        // 迁移旧配置格式
        this.settings = this.migrateOldSettings(this.settings);
    }

    /**
     * 迁移旧配置格式到新的正则表达式格式
     */
    private migrateOldSettings(settings: any): CleanFilesSettings {
        let needsSave = false;

        // 迁移可清理扩展名配置
        if (settings.cleanableExtensions && Array.isArray(settings.cleanableExtensions)) {
            const extensions = settings.cleanableExtensions.map((ext: string) => 
                ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            settings.cleanablePattern = extensions.length > 0 ? 
                `\\.(${extensions.join('|').replace(/\\\.\\\*/g, '.*')})$` : '.*';
            delete settings.cleanableExtensions;
            needsSave = true;
        }

        // 迁移保护扩展名配置
        if (settings.protectedExtensions && Array.isArray(settings.protectedExtensions)) {
            const extensions = settings.protectedExtensions.map((ext: string) => 
                ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            settings.protectedPattern = extensions.length > 0 ? 
                `\\.(${extensions.join('|').replace(/\\\.\\\*/g, '.*')})$` : '';
            delete settings.protectedExtensions;
            needsSave = true;
        }

        // 如果有迁移，异步保存设置
        if (needsSave) {
            setTimeout(() => this.saveSettings(), 0);
        }

        return settings;
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
        // 更新多语言管理器语言设置
        if (this.i18nManager) {
            this.i18nManager.setLanguage(this.settings.language);
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
     * 获取多语言管理器
     */
    getI18nManager(): I18nManager {
        return this.i18nManager;
    }

    /**
     * 打开清理文件模态框
     */
    private openCleanFilesModal() {
        const modal = new CleanFilesModal(this.app, this.scanner, this.i18nManager);
        modal.open();
    }
}