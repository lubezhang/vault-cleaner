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

        // 可清理文件匹配模式设置
        this.createPatternSetting(
            this.i18nManager.t('settings.cleanable_pattern'),
            this.i18nManager.t('settings.cleanable_pattern_desc'),
            'cleanablePattern'
        );

        // 保护文件匹配模式设置
        this.createPatternSetting(
            this.i18nManager.t('settings.protected_pattern'),
            this.i18nManager.t('settings.protected_pattern_desc'),
            'protectedPattern'
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
     * 创建正则表达式模式设置
     */
    private createPatternSetting(
        name: string,
        desc: string,
        settingKey: keyof CleanFilesSettings
    ): void {
        const { containerEl } = this;

        // 创建设置容器
        const setting = new Setting(containerEl)
            .setName(name)
            .setDesc(desc);

        const patternContainer = containerEl.createDiv('pattern-container');
        patternContainer.style.marginTop = '10px';
        patternContainer.style.marginBottom = '20px';

        // 正则表达式输入框
        const inputDiv = patternContainer.createDiv('pattern-input');
        inputDiv.style.marginBottom = '10px';

        const patternInput = inputDiv.createEl('input', {
            type: 'text',
            placeholder: this.i18nManager.t('settings.pattern_placeholder'),
            value: this.plugin.settings[settingKey] as string
        });
        patternInput.style.width = '100%';
        patternInput.style.padding = '8px 12px';
        patternInput.style.border = '1px solid var(--background-modifier-border)';
        patternInput.style.borderRadius = '4px';
        patternInput.style.backgroundColor = 'var(--background-primary)';
        patternInput.style.color = 'var(--text-normal)';
        patternInput.style.fontSize = '14px';

        // 验证状态显示
        const statusDiv = patternContainer.createDiv('pattern-status');
        statusDiv.style.marginBottom = '10px';
        statusDiv.style.fontSize = '12px';
        statusDiv.style.minHeight = '16px';

        // 仅为保护文件模式显示示例
        if (settingKey === 'protectedPattern') {
            // 常用模式示例
            const examplesDiv = patternContainer.createDiv('pattern-examples');
            examplesDiv.style.marginTop = '10px';

            const examplesTitle = examplesDiv.createEl('div', {
                text: this.i18nManager.t('settings.pattern_examples')
            });
            examplesTitle.style.fontWeight = 'bold';
            examplesTitle.style.marginBottom = '5px';
            examplesTitle.style.fontSize = '12px';
            examplesTitle.style.color = 'var(--text-muted)';

            const examples = [
                { key: 'pattern_all_files', pattern: '.*' },
                { key: 'pattern_temp_files', pattern: '\\.(tmp|temp|bak)$|~$' },
                { key: 'pattern_image_files', pattern: '\\.(jpg|jpeg|png|gif|bmp)$' },
                { key: 'pattern_hidden_files', pattern: '^\\.' },
                { key: 'pattern_obsidian_core', pattern: '\\.(md|canvas)$' },
                { key: 'pattern_obsidian_config', pattern: '\\.obsidian/.*\\.json$' },
                { key: 'pattern_obsidian_plugins', pattern: '\\.obsidian/plugins/.*\\.(js|css)$' },
                { key: 'pattern_obsidian_themes', pattern: '\\.obsidian/themes/.*\\.css$' },
                { key: 'pattern_obsidian_cache', pattern: '\\.obsidian/.*\\.cache$' }
            ];

            examples.forEach(example => {
                const exampleDiv = examplesDiv.createDiv('pattern-example');
                exampleDiv.style.display = 'flex';
                exampleDiv.style.alignItems = 'center';
                exampleDiv.style.marginBottom = '3px';
                exampleDiv.style.fontSize = '11px';
                exampleDiv.style.color = 'var(--text-muted)';
                exampleDiv.style.cursor = 'pointer';
                exampleDiv.style.padding = '2px 4px';
                exampleDiv.style.borderRadius = '3px';

                exampleDiv.textContent = this.i18nManager.t(`settings.${example.key}`);

                exampleDiv.addEventListener('mouseenter', () => {
                    exampleDiv.style.backgroundColor = 'var(--background-modifier-hover)';
                });

                exampleDiv.addEventListener('mouseleave', () => {
                    exampleDiv.style.backgroundColor = 'transparent';
                });

                exampleDiv.addEventListener('click', () => {
                    patternInput.value = example.pattern;
                    validateAndSave();
                });
            });
        }

        // 验证正则表达式并保存
        const validateAndSave = async () => {
            const pattern = patternInput.value.trim();

            try {
                // 验证正则表达式
                new RegExp(pattern);

                // 保存设置
                (this.plugin.settings[settingKey] as string) = pattern;
                await this.plugin.saveSettings();

                // 显示成功状态
                statusDiv.textContent = '';
                statusDiv.style.color = 'var(--text-success)';
                patternInput.style.borderColor = 'var(--background-modifier-border)';

            } catch (error) {
                // 显示错误状态
                statusDiv.textContent = this.i18nManager.t('settings.pattern_invalid');
                statusDiv.style.color = 'var(--text-error)';
                patternInput.style.borderColor = 'var(--text-error)';
            }
        };

        // 输入事件监听
        let debounceTimer: NodeJS.Timeout;
        patternInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(validateAndSave, 500);
        });

        // 失去焦点时立即验证
        patternInput.addEventListener('blur', validateAndSave);

        // 初始验证
        validateAndSave();
    }
}