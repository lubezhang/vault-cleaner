import { App, PluginSettingTab, Setting } from 'obsidian';
import CleanFilesPlugin from './main';
import { CleanFilesSettings } from './types';

/**
 * Clean Files 插件设置页面
 */
export class CleanFilesSettingTab extends PluginSettingTab {
    plugin: CleanFilesPlugin;

    constructor(app: App, plugin: CleanFilesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Clean Files 设置' });

        // 需要清理的文件扩展名设置
        this.createExtensionListSetting(
            '需要清理的文件扩展名',
            '这些扩展名的文件将被识别为可清理文件',
            'cleanableExtensions'
        );

        // 保护的文件扩展名设置
        this.createExtensionListSetting(
            '保护的文件扩展名',
            '这些扩展名的文件将被保护，不会被清理',
            'protectedExtensions'
        );

        // 扫描深度设置
        new Setting(containerEl)
            .setName('最大扫描深度')
            .setDesc('设置扫描文件夹的最大深度（0表示无限制）')
            .addSlider(slider => slider
                .setLimits(0, 20, 1)
                .setValue(this.plugin.settings.maxScanDepth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxScanDepth = value;
                    await this.plugin.saveSettings();
                }));

        // 排除隐藏文件设置
        new Setting(containerEl)
            .setName('排除隐藏文件')
            .setDesc('是否在扫描时排除隐藏文件和文件夹')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.excludeHidden)
                .onChange(async (value) => {
                    this.plugin.settings.excludeHidden = value;
                    await this.plugin.saveSettings();
                }));

        // 最小文件大小设置
        new Setting(containerEl)
            .setName('最小文件大小 (字节)')
            .setDesc('只扫描大于此大小的文件（0表示扫描所有文件）')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(this.plugin.settings.minFileSize.toString())
                .onChange(async (value) => {
                    const size = parseInt(value) || 0;
                    this.plugin.settings.minFileSize = size;
                    await this.plugin.saveSettings();
                }));

        // 重置设置按钮
        new Setting(containerEl)
            .setName('重置设置')
            .setDesc('将所有设置重置为默认值')
            .addButton(button => button
                .setButtonText('重置')
                .setWarning()
                .onClick(async () => {
                    await this.plugin.resetSettings();
                    this.display();
                }));
    }

    /**
     * 创建扩展名列表设置
     */
    private createExtensionListSetting(
        name: string,
        desc: string,
        settingKey: keyof CleanFilesSettings
    ): void {
        const { containerEl } = this;
        
        // 创建设置容器
        const setting = new Setting(containerEl)
            .setName(name)
            .setDesc(desc);

        const extensionContainer = containerEl.createDiv('extension-list-container');
        extensionContainer.style.marginTop = '10px';
        extensionContainer.style.marginBottom = '20px';

        // 显示当前扩展名列表
        const updateExtensionList = () => {
            extensionContainer.empty();
            
            const extensions = this.plugin.settings[settingKey] as string[];
            
            extensions.forEach((ext, index) => {
                const itemDiv = extensionContainer.createDiv('extension-item');
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.marginBottom = '5px';
                itemDiv.style.gap = '10px';

                const input = itemDiv.createEl('input', {
                    type: 'text',
                    value: ext
                });
                input.style.flex = '1';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid var(--background-modifier-border)';
                input.style.borderRadius = '4px';
                input.style.backgroundColor = 'var(--background-primary)';
                input.style.color = 'var(--text-normal)';

                input.addEventListener('change', async () => {
                    const newExtensions = [...extensions];
                    newExtensions[index] = input.value.trim();
                    (this.plugin.settings[settingKey] as string[]) = newExtensions;
                    await this.plugin.saveSettings();
                });

                const deleteButton = itemDiv.createEl('button', {
                    text: '删除'
                });
                deleteButton.style.padding = '4px 8px';
                deleteButton.style.border = '1px solid var(--background-modifier-border)';
                deleteButton.style.borderRadius = '4px';
                deleteButton.style.backgroundColor = 'var(--interactive-accent)';
                deleteButton.style.color = 'var(--text-on-accent)';
                deleteButton.style.cursor = 'pointer';

                deleteButton.addEventListener('click', async () => {
                    const newExtensions = extensions.filter((_, i) => i !== index);
                    (this.plugin.settings[settingKey] as string[]) = newExtensions;
                    await this.plugin.saveSettings();
                    updateExtensionList();
                });
            });

            // 添加新扩展名的输入框和按钮
            const addDiv = extensionContainer.createDiv('add-extension');
            addDiv.style.display = 'flex';
            addDiv.style.alignItems = 'center';
            addDiv.style.gap = '10px';
            addDiv.style.marginTop = '10px';

            const newExtInput = addDiv.createEl('input', {
                type: 'text',
                placeholder: '输入新的扩展名（如：.txt）'
            });
            newExtInput.style.flex = '1';
            newExtInput.style.padding = '4px 8px';
            newExtInput.style.border = '1px solid var(--background-modifier-border)';
            newExtInput.style.borderRadius = '4px';
            newExtInput.style.backgroundColor = 'var(--background-primary)';
            newExtInput.style.color = 'var(--text-normal)';

            const addButton = addDiv.createEl('button', {
                text: '添加'
            });
            addButton.style.padding = '4px 8px';
            addButton.style.border = '1px solid var(--background-modifier-border)';
            addButton.style.borderRadius = '4px';
            addButton.style.backgroundColor = 'var(--interactive-accent)';
            addButton.style.color = 'var(--text-on-accent)';
            addButton.style.cursor = 'pointer';

            const addExtension = async () => {
                const newExt = newExtInput.value.trim();
                if (newExt && !extensions.includes(newExt)) {
                    const newExtensions = [...extensions, newExt];
                    (this.plugin.settings[settingKey] as string[]) = newExtensions;
                    await this.plugin.saveSettings();
                    newExtInput.value = '';
                    updateExtensionList();
                }
            };

            addButton.addEventListener('click', addExtension);
            newExtInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addExtension();
                }
            });
        };

        updateExtensionList();
    }
}