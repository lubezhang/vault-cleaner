import { App, PluginSettingTab, Setting } from 'obsidian';
import CleanFilesPlugin from './main';
import { CleanFilesSettings, SupportedLanguage } from './types';
import { I18nManager } from './i18n/I18nManager';

/**
 * Clean Files 插件设置页面
 */
export class CleanFilesSettingTab extends PluginSettingTab {
    plugin: CleanFilesPlugin;
    private i18nManager: I18nManager;

    constructor(app: App, plugin: CleanFilesPlugin, i18nManager: I18nManager) {
        super(app, plugin);
        this.plugin = plugin;
        this.i18nManager = i18nManager;
        
        // 监听语言变更，重新渲染界面
        this.i18nManager.onLanguageChange(() => {
            this.display();
        });
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: this.i18nManager.t('settings.title') });

        // 语言选择设置
        new Setting(containerEl)
            .setName(this.i18nManager.t('settings.language'))
            .setDesc(this.i18nManager.t('settings.language_desc'))
            .addDropdown(dropdown => {
                const languages = this.i18nManager.getSupportedLanguages();
                languages.forEach(lang => {
                    dropdown.addOption(lang.code, lang.name);
                });
                dropdown.setValue(this.plugin.settings.language);
                dropdown.onChange(async (value: SupportedLanguage) => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                });
            });

        // 需要清理的文件扩展名设置
        this.createExtensionListSetting(
            this.i18nManager.t('settings.cleanable_extensions'),
            this.i18nManager.t('settings.cleanable_extensions_desc'),
            'cleanableExtensions'
        );

        // 保护的文件扩展名设置
        this.createExtensionListSetting(
            this.i18nManager.t('settings.protected_extensions'),
            this.i18nManager.t('settings.protected_extensions_desc'),
            'protectedExtensions'
        );

        // 扫描深度设置
        new Setting(containerEl)
            .setName(this.i18nManager.t('settings.max_scan_depth'))
            .setDesc(this.i18nManager.t('settings.max_scan_depth_desc'))
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
            .setName(this.i18nManager.t('settings.exclude_hidden'))
            .setDesc(this.i18nManager.t('settings.exclude_hidden_desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.excludeHidden)
                .onChange(async (value) => {
                    this.plugin.settings.excludeHidden = value;
                    await this.plugin.saveSettings();
                }));

        // 最小文件大小设置
        new Setting(containerEl)
            .setName(this.i18nManager.t('settings.min_file_size'))
            .setDesc(this.i18nManager.t('settings.min_file_size_desc'))
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
            .setName(this.i18nManager.t('settings.reset_settings'))
            .setDesc(this.i18nManager.t('settings.reset_settings_desc'))
            .addButton(button => button
                .setButtonText(this.i18nManager.t('settings.reset_settings'))
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
                    text: this.i18nManager.t('common.delete')
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
                placeholder: this.i18nManager.t('settings.extension_placeholder')
            });
            newExtInput.style.flex = '1';
            newExtInput.style.padding = '4px 8px';
            newExtInput.style.border = '1px solid var(--background-modifier-border)';
            newExtInput.style.borderRadius = '4px';
            newExtInput.style.backgroundColor = 'var(--background-primary)';
            newExtInput.style.color = 'var(--text-normal)';

            const addButton = addDiv.createEl('button', {
                text: this.i18nManager.t('settings.add_extension')
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