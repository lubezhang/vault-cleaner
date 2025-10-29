import { Modal, App, Setting, Notice } from 'obsidian';
import { ScanItem, ScanResult } from './types';
import { FileScanner } from './scanner';
import { I18nManager } from './i18n/I18nManager';

/**
 * 清理文件主界面
 */
export class CleanFilesModal extends Modal {
    private scanner: FileScanner;
    private i18nManager: I18nManager;
    private scanResult: ScanResult | null = null;
    private isScanning = false;

    constructor(app: App, scanner: FileScanner, i18nManager: I18nManager) {
        super(app);
        this.scanner = scanner;
        this.i18nManager = i18nManager;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置标题
        contentEl.createEl('h2', { text: this.i18nManager.t('ui.title') });

        // 创建主界面
        this.createMainInterface();

        // 自动开始扫描
        this.handleScan();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * 创建主界面
     */
    private createMainInterface() {
        const { contentEl } = this;

        // 设置信息区域
        // this.createSettingsInfo();

        // 结果显示区域
        const resultSection = contentEl.createDiv('clean-files-result-section');

        if (this.isScanning) {
            resultSection.createEl('p', {
                text: this.i18nManager.t('ui.scanning'),
                cls: 'clean-files-scanning'
            });
        } else if (this.scanResult) {
            this.renderScanResults(resultSection);
        } else {
            resultSection.createEl('p', {
                text: this.i18nManager.t('ui.ready_to_scan'),
                cls: 'clean-files-placeholder'
            });
        }
    }

    /**
     * 处理扫描操作
     */
    private async handleScan() {
        if (this.isScanning) return;

        this.isScanning = true;
        this.refresh();

        try {
            new Notice(this.i18nManager.t('messages.scan_started'));
            this.scanResult = await this.scanner.scanFiles();

            const totalCount = this.scanResult.totalCount;
            if (totalCount === 0) {
                new Notice(this.i18nManager.t('messages.no_items_found'));
            } else {
                new Notice(this.i18nManager.t('messages.items_found', { count: totalCount.toString() }));
            }

            this.refresh();
        } catch (error) {
            new Notice(this.i18nManager.t('messages.scan_failed', { error: error.message }));
            console.error('扫描错误:', error);
        } finally {
            this.isScanning = false;
            this.refresh();
        }
    }

    /**
     * 渲染扫描结果
     */
    private renderScanResults(container: HTMLElement) {
        container.empty();

        if (!this.scanResult || this.scanResult.totalCount === 0) {
            container.createEl('p', {
                text: this.i18nManager.t('ui.no_results'),
                cls: 'clean-files-no-results'
            });
            return;
        }

        // 统计信息
        const statsEl = container.createDiv('clean-files-stats');
        statsEl.createEl('p', {
            text: `共发现 ${this.scanResult.totalCount} 个项目，总大小: ${this.formatFileSize(this.scanResult.totalSize)}`
        });

        // 空目录列表
        if (this.scanResult.emptyDirectories.length > 0) {
            this.renderItemList(container, this.i18nManager.t('ui.empty_directories'), this.scanResult.emptyDirectories);
        }

        // 无关联文件列表
        if (this.scanResult.unlinkedFiles.length > 0) {
            this.renderItemList(container, this.i18nManager.t('ui.unlinked_files'), this.scanResult.unlinkedFiles);
        }

        // 操作按钮
        this.renderActionButtons(container);
    }

    /**
     * 渲染项目列表
     */
    private renderItemList(container: HTMLElement, title: string, items: ScanItem[]) {
        const section = container.createDiv('clean-files-list-section');

        // 标题和全选
        const header = section.createDiv('clean-files-list-header');
        header.createEl('h3', { text: `${title} (${items.length})` });

        const selectAllBtn = header.createEl('button', {
            text: this.i18nManager.t('ui.select_all'),
            cls: 'clean-files-select-all'
        });
        selectAllBtn.onclick = () => this.toggleSelectAll(items);

        // 列表
        const listEl = section.createDiv('clean-files-list');

        items.forEach(item => {
            const itemEl = listEl.createDiv('clean-files-item');

            // 复选框
            const checkbox = itemEl.createEl('input', {
                type: 'checkbox'
            }) as HTMLInputElement;
            checkbox.checked = item.selected || false;
            checkbox.onchange = () => {
                item.selected = checkbox.checked;
            };

            // 文件信息
            const infoEl = itemEl.createDiv('clean-files-item-info');
            infoEl.createEl('div', {
                text: item.path,
                cls: 'clean-files-item-path'
            });

            if (item.size !== undefined && item.size > 0) {
                infoEl.createEl('div', {
                    text: this.formatFileSize(item.size),
                    cls: 'clean-files-item-size'
                });
            }
        });
    }

    /**
     * 渲染操作按钮
     */
    private renderActionButtons(container: HTMLElement) {
        const buttonSection = container.createDiv('clean-files-actions');

        // 删除按钮
        const deleteBtn = buttonSection.createEl('button', {
            text: this.i18nManager.t('ui.delete_selected'),
            cls: 'mod-warning clean-files-delete-btn'
        });
        deleteBtn.onclick = () => this.handleDelete();

        // 取消选择按钮
        const clearBtn = buttonSection.createEl('button', {
            text: this.i18nManager.t('ui.clear_selection'),
            cls: 'clean-files-clear-btn'
        });
        clearBtn.onclick = () => this.clearSelection();
    }

    /**
     * 切换全选状态
     */
    private toggleSelectAll(items: ScanItem[]) {
        const allSelected = items.every(item => item.selected);
        items.forEach(item => {
            item.selected = !allSelected;
        });
        this.refresh();
    }

    /**
     * 清除选择
     */
    private clearSelection() {
        if (!this.scanResult) return;

        [...this.scanResult.emptyDirectories, ...this.scanResult.unlinkedFiles]
            .forEach(item => {
                item.selected = false;
            });
        this.refresh();
    }

    /**
     * 处理删除操作
     */
    private async handleDelete() {
        if (!this.scanResult) return;

        const selectedItems = [
            ...this.scanResult.emptyDirectories,
            ...this.scanResult.unlinkedFiles
        ].filter(item => item.selected);

        if (selectedItems.length === 0) {
            new Notice(this.i18nManager.t('messages.select_items_first'));
            return;
        }

        // 确认对话框
        const confirmed = await this.showConfirmDialog(selectedItems);
        if (!confirmed) return;

        try {
            new Notice(this.i18nManager.t('messages.deleting'));
            const result = await this.scanner.deleteItems(selectedItems);

            if (result.success) {
                new Notice(this.i18nManager.t('messages.delete_success', { count: selectedItems.length.toString() }));
                // 重新扫描
                await this.handleScan();
            } else {
                new Notice(this.i18nManager.t('messages.delete_partial', { errorCount: result.errors.length.toString() }));
                result.errors.forEach(error => console.error(error));
            }
        } catch (error) {
            new Notice(this.i18nManager.t('messages.delete_failed', { error: error.message }));
            console.error('删除错误:', error);
        }
    }

    /**
     * 显示确认对话框
     */
    private showConfirmDialog(items: ScanItem[]): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);

            modal.contentEl.createEl('h3', { text: this.i18nManager.t('ui.confirm_delete') });
            modal.contentEl.createEl('p', {
                text: this.i18nManager.t('ui.confirm_delete_message', { count: items.length.toString() })
            });

            const list = modal.contentEl.createEl('ul');
            items.slice(0, 10).forEach(item => {
                list.createEl('li', { text: item.path });
            });

            if (items.length > 10) {
                modal.contentEl.createEl('p', {
                    text: this.i18nManager.t('ui.more_items', { count: (items.length - 10).toString() })
                });
            }

            const buttonDiv = modal.contentEl.createDiv('modal-button-container');

            const cancelBtn = buttonDiv.createEl('button', { text: this.i18nManager.t('common.cancel') });
            cancelBtn.onclick = () => {
                modal.close();
                resolve(false);
            };

            const confirmBtn = buttonDiv.createEl('button', {
                text: this.i18nManager.t('ui.confirm_delete_button'),
                cls: 'mod-warning'
            });
            confirmBtn.onclick = () => {
                modal.close();
                resolve(true);
            };

            modal.open();
        });
    }

    /**
     * 格式化文件大小
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 刷新界面
     */
    /**
     * 创建设置信息区域
     */
    private createSettingsInfo() {
        const { contentEl } = this;

        const settingsSection = contentEl.createDiv('clean-files-settings-info');
        settingsSection.createEl('h3', { text: this.i18nManager.t('ui.current_config') });

        const infoContainer = settingsSection.createDiv('settings-info-container');

        // 获取扫描器的设置
        const settings = (this.scanner as any).settings;

        // 显示可清理的扩展名
        const cleanableDiv = infoContainer.createDiv('setting-info-item');
        cleanableDiv.createEl('span', { text: this.i18nManager.t('settings.cleanable_extensions') + ': ', cls: 'setting-label' });
        cleanableDiv.createEl('span', {
            text: settings.cleanableExtensions.join(', ') || this.i18nManager.t('common.none'),
            cls: 'setting-value'
        });

        // 显示保护的扩展名
        const protectedDiv = infoContainer.createDiv('setting-info-item');
        protectedDiv.createEl('span', { text: this.i18nManager.t('settings.protected_extensions') + ': ', cls: 'setting-label' });
        protectedDiv.createEl('span', {
            text: settings.protectedExtensions.join(', ') || this.i18nManager.t('common.none'),
            cls: 'setting-value'
        });

        // 显示扫描深度
        const depthDiv = infoContainer.createDiv('setting-info-item');
        depthDiv.createEl('span', { text: this.i18nManager.t('settings.max_scan_depth') + ': ', cls: 'setting-label' });
        depthDiv.createEl('span', {
            text: settings.maxScanDepth.toString(),
            cls: 'setting-value'
        });

        // 显示其他设置
        const otherDiv = infoContainer.createDiv('setting-info-item');
        otherDiv.createEl('span', { text: this.i18nManager.t('ui.other_settings') + ': ', cls: 'setting-label' });
        const otherSettings = [];
        if (settings.excludeHidden) otherSettings.push(this.i18nManager.t('settings.exclude_hidden'));
        if (settings.minFileSize > 0) otherSettings.push(this.i18nManager.t('ui.min_file_size_display', { size: settings.minFileSize.toString() }));
        otherDiv.createEl('span', {
            text: otherSettings.join(', ') || this.i18nManager.t('ui.no_special_settings'),
            cls: 'setting-value'
        });
    }

    private refresh() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置标题
        contentEl.createEl('h2', { text: this.i18nManager.t('ui.title') });

        // 重新创建主界面，但不触发扫描
        this.createMainInterface();
    }
}