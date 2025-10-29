import { Modal, App, Setting, Notice } from 'obsidian';
import { ScanItem, ScanResult } from './types';
import { FileScanner } from './scanner';

/**
 * 清理文件主界面
 */
export class CleanFilesModal extends Modal {
    private scanner: FileScanner;
    private scanResult: ScanResult | null = null;
    private isScanning = false;

    constructor(app: App, scanner: FileScanner) {
        super(app);
        this.scanner = scanner;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置标题
        contentEl.createEl('h2', { text: 'Clean Files - 清理文件' });

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
                text: '正在扫描文件，请稍候...',
                cls: 'clean-files-scanning'
            });
        } else if (this.scanResult) {
            this.renderScanResults(resultSection);
        } else {
            resultSection.createEl('p', {
                text: '准备开始扫描...',
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
            new Notice('开始扫描文件...');
            this.scanResult = await this.scanner.scanFiles();

            const totalCount = this.scanResult.totalCount;
            if (totalCount === 0) {
                new Notice('未发现需要清理的文件');
            } else {
                new Notice(`发现 ${totalCount} 个项目需要清理`);
            }

            this.refresh();
        } catch (error) {
            new Notice(`扫描失败: ${error.message}`);
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
                text: '没有发现需要清理的文件',
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
            this.renderItemList(container, '空目录', this.scanResult.emptyDirectories);
        }

        // 无关联文件列表
        if (this.scanResult.unlinkedFiles.length > 0) {
            this.renderItemList(container, '无关联文件', this.scanResult.unlinkedFiles);
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
            text: '全选',
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
            text: '删除选中项目',
            cls: 'mod-warning clean-files-delete-btn'
        });
        deleteBtn.onclick = () => this.handleDelete();

        // 取消选择按钮
        const clearBtn = buttonSection.createEl('button', {
            text: '取消选择',
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
            new Notice('请先选择要删除的项目');
            return;
        }

        // 确认对话框
        const confirmed = await this.showConfirmDialog(selectedItems);
        if (!confirmed) return;

        try {
            new Notice('正在删除文件...');
            const result = await this.scanner.deleteItems(selectedItems);

            if (result.success) {
                new Notice(`成功删除 ${selectedItems.length} 个项目`);
                // 重新扫描
                await this.handleScan();
            } else {
                new Notice(`删除完成，但有 ${result.errors.length} 个错误`);
                result.errors.forEach(error => console.error(error));
            }
        } catch (error) {
            new Notice(`删除失败: ${error.message}`);
            console.error('删除错误:', error);
        }
    }

    /**
     * 显示确认对话框
     */
    private showConfirmDialog(items: ScanItem[]): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);

            modal.contentEl.createEl('h3', { text: '确认删除' });
            modal.contentEl.createEl('p', {
                text: `您确定要删除以下 ${items.length} 个项目吗？此操作不可撤销。`
            });

            const list = modal.contentEl.createEl('ul');
            items.slice(0, 10).forEach(item => {
                list.createEl('li', { text: item.path });
            });

            if (items.length > 10) {
                modal.contentEl.createEl('p', {
                    text: `...还有 ${items.length - 10} 个项目`
                });
            }

            const buttonDiv = modal.contentEl.createDiv('modal-button-container');

            const cancelBtn = buttonDiv.createEl('button', { text: '取消' });
            cancelBtn.onclick = () => {
                modal.close();
                resolve(false);
            };

            const confirmBtn = buttonDiv.createEl('button', {
                text: '确认删除',
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
        settingsSection.createEl('h3', { text: '当前配置' });

        const infoContainer = settingsSection.createDiv('settings-info-container');

        // 获取扫描器的设置
        const settings = (this.scanner as any).settings;

        // 显示可清理的扩展名
        const cleanableDiv = infoContainer.createDiv('setting-info-item');
        cleanableDiv.createEl('span', { text: '可清理扩展名: ', cls: 'setting-label' });
        cleanableDiv.createEl('span', {
            text: settings.cleanableExtensions.join(', ') || '无',
            cls: 'setting-value'
        });

        // 显示保护的扩展名
        const protectedDiv = infoContainer.createDiv('setting-info-item');
        protectedDiv.createEl('span', { text: '保护扩展名: ', cls: 'setting-label' });
        protectedDiv.createEl('span', {
            text: settings.protectedExtensions.join(', ') || '无',
            cls: 'setting-value'
        });

        // 显示扫描深度
        const depthDiv = infoContainer.createDiv('setting-info-item');
        depthDiv.createEl('span', { text: '扫描深度: ', cls: 'setting-label' });
        depthDiv.createEl('span', {
            text: settings.maxScanDepth.toString(),
            cls: 'setting-value'
        });

        // 显示其他设置
        const otherDiv = infoContainer.createDiv('setting-info-item');
        otherDiv.createEl('span', { text: '其他设置: ', cls: 'setting-label' });
        const otherSettings = [];
        if (settings.excludeHidden) otherSettings.push('排除隐藏文件');
        if (settings.minFileSize > 0) otherSettings.push(`最小文件大小: ${settings.minFileSize}字节`);
        otherDiv.createEl('span', {
            text: otherSettings.join(', ') || '无特殊设置',
            cls: 'setting-value'
        });
    }

    private refresh() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置标题
        contentEl.createEl('h2', { text: 'Clean Files - 清理文件' });

        // 重新创建主界面，但不触发扫描
        this.createMainInterface();
    }
}