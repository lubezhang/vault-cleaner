import { App } from 'obsidian';

// 支持的语言类型
export type SupportedLanguage = 'zh-CN' | 'en-US';

// 语言资源接口
interface LanguageResource {
    common: {
        confirm: string;
        cancel: string;
        delete: string;
        select_all: string;
        clear_selection: string;
        none: string;
    };
    ui: {
        title: string;
        scanning: string;
        ready_to_scan: string;
        no_results: string;
        empty_directories: string;
        unlinked_files: string;
        select_all: string;
        delete_selected: string;
        clear_selection: string;
        confirm_delete: string;
        confirm_delete_message: string;
        more_items: string;
        confirm_delete_button: string;
        current_config: string;
        other_settings: string;
        min_file_size_display: string;
        no_special_settings: string;
    };
    settings: {
        title: string;
        language: string;
        language_desc: string;
        cleanable_extensions: string;
        cleanable_extensions_desc: string;
        protected_extensions: string;
        protected_extensions_desc: string;
        max_scan_depth: string;
        max_scan_depth_desc: string;
        exclude_hidden: string;
        exclude_hidden_desc: string;
        min_file_size: string;
        min_file_size_desc: string;
        reset_settings: string;
        reset_settings_desc: string;
        add_extension: string;
        extension_placeholder: string;
    };
    messages: {
        scan_started: string;
        scan_failed: string;
        no_items_found: string;
        items_found: string;
        select_items_first: string;
        deleting: string;
        delete_success: string;
        delete_partial: string;
        delete_failed: string;
    };
    languages: {
        'zh-CN': string;
        'en-US': string;
    };
}

/**
 * 多语言管理器
 * 负责语言检测、切换、翻译等核心功能
 */
export class I18nManager {
    private app: App;
    private currentLanguage: SupportedLanguage;
    private languageResources: Map<SupportedLanguage, LanguageResource> = new Map();
    private onLanguageChangeCallbacks: Array<(language: SupportedLanguage) => void> = [];

    constructor(app: App, initialLanguage?: SupportedLanguage) {
        this.app = app;
        this.currentLanguage = initialLanguage || this.detectSystemLanguage();
        this.loadLanguageResources();
    }

    /**
     * 检测系统语言
     * 根据 Obsidian 的语言设置或浏览器语言自动检测
     */
    private detectSystemLanguage(): SupportedLanguage {
        // 尝试从 Obsidian 设置中获取语言
        const obsidianLang = (this.app as any).vault?.config?.lang;
        if (obsidianLang) {
            if (obsidianLang.startsWith('zh')) {
                return 'zh-CN';
            }
            if (obsidianLang.startsWith('en')) {
                return 'en-US';
            }
        }

        // 尝试从浏览器语言获取
        const browserLang = navigator.language || (navigator as any).userLanguage;
        if (browserLang) {
            if (browserLang.startsWith('zh')) {
                return 'zh-CN';
            }
            if (browserLang.startsWith('en')) {
                return 'en-US';
            }
        }

        // 默认返回英文
        return 'en-US';
    }

    /**
     * 加载语言资源文件
     */
    private async loadLanguageResources(): Promise<void> {
        const languages: SupportedLanguage[] = ['zh-CN', 'en-US'];
        
        for (const lang of languages) {
            try {
                // 在 Obsidian 插件环境中，需要通过 require 或动态导入来加载 JSON 文件
                // 这里使用静态导入的方式，因为 Obsidian 插件打包时会处理这些资源
                let resource: LanguageResource;
                
                if (lang === 'zh-CN') {
                    resource = await import('./zh-CN.json');
                } else {
                    resource = await import('./en-US.json');
                }
                
                this.languageResources.set(lang, resource);
            } catch (error) {
                console.error(`Failed to load language resource for ${lang}:`, error);
                
                // 如果加载失败，使用默认的中文资源
                if (lang === 'zh-CN') {
                    this.languageResources.set(lang, this.getDefaultChineseResource());
                } else {
                    this.languageResources.set(lang, this.getDefaultEnglishResource());
                }
            }
        }
    }

    /**
     * 获取默认中文资源（作为备用）
     */
    private getDefaultChineseResource(): LanguageResource {
        return {
            common: {
                confirm: "确认",
                cancel: "取消",
                delete: "删除",
                select_all: "全选",
                clear_selection: "取消选择",
                none: "无"
            },
            ui: {
                title: "Clean Files - 清理文件",
                scanning: "正在扫描文件，请稍候...",
                ready_to_scan: "准备开始扫描...",
                no_results: "没有发现需要清理的文件",
                empty_directories: "空目录",
                unlinked_files: "无关联文件",
                select_all: "全选",
                delete_selected: "删除选中项目",
                clear_selection: "取消选择",
                confirm_delete: "确认删除",
                confirm_delete_message: "您确定要删除以下 {{count}} 个项目吗？此操作不可撤销。",
                more_items: "...还有 {{count}} 个项目",
                confirm_delete_button: "确认删除",
                current_config: "当前配置",
                other_settings: "其他设置",
                min_file_size_display: "最小文件大小: {{size}}字节",
                no_special_settings: "无特殊设置"
            },
            settings: {
                title: "Clean Files 设置",
                language: "界面语言",
                language_desc: "选择插件界面显示语言",
                cleanable_extensions: "需要清理的文件扩展名",
                cleanable_extensions_desc: "这些扩展名的文件将被识别为可清理文件",
                protected_extensions: "保护的文件扩展名",
                protected_extensions_desc: "这些扩展名的文件将被保护，不会被清理",
                max_scan_depth: "最大扫描深度",
                max_scan_depth_desc: "设置扫描文件夹的最大深度（0表示无限制）",
                exclude_hidden: "排除隐藏文件",
                exclude_hidden_desc: "是否在扫描时排除隐藏文件和文件夹",
                min_file_size: "最小文件大小 (字节)",
                min_file_size_desc: "只扫描大于此大小的文件（0表示扫描所有文件）",
                reset_settings: "重置设置",
                reset_settings_desc: "将所有设置重置为默认值",
                add_extension: "添加",
                extension_placeholder: "输入新的扩展名（如：.txt）"
            },
            messages: {
                scan_started: "开始扫描文件...",
                scan_failed: "扫描失败: {{error}}",
                no_items_found: "未发现需要清理的文件",
                items_found: "发现 {{count}} 个项目需要清理",
                select_items_first: "请先选择要删除的项目",
                deleting: "正在删除文件...",
                delete_success: "成功删除 {{count}} 个项目",
                delete_partial: "删除完成，但有 {{errorCount}} 个错误",
                delete_failed: "删除失败: {{error}}"
            },
            languages: {
                'zh-CN': "中文",
                'en-US': "English"
            }
        };
    }

    /**
     * 获取默认英文资源（作为备用）
     */
    private getDefaultEnglishResource(): LanguageResource {
        return {
            common: {
                confirm: "Confirm",
                cancel: "Cancel",
                delete: "Delete",
                select_all: "Select All",
                clear_selection: "Clear Selection",
                none: "None"
            },
            ui: {
                title: "Clean Files - File Cleaner",
                scanning: "Scanning files, please wait...",
                ready_to_scan: "Ready to start scanning...",
                no_results: "No files found that need cleaning",
                empty_directories: "Empty Directories",
                unlinked_files: "Unlinked Files",
                select_all: "Select All",
                delete_selected: "Delete Selected",
                clear_selection: "Clear Selection",
                confirm_delete: "Confirm Delete",
                confirm_delete_message: "Are you sure you want to delete the following {{count}} items? This action cannot be undone.",
                more_items: "...and {{count}} more items",
                confirm_delete_button: "Confirm Delete",
                current_config: "Current Configuration",
                other_settings: "Other Settings",
                min_file_size_display: "Min file size: {{size}} bytes",
                no_special_settings: "No special settings"
            },
            settings: {
                title: "Clean Files Settings",
                language: "Interface Language",
                language_desc: "Select the display language for the plugin interface",
                cleanable_extensions: "Cleanable File Extensions",
                cleanable_extensions_desc: "Files with these extensions will be identified as cleanable",
                protected_extensions: "Protected File Extensions",
                protected_extensions_desc: "Files with these extensions will be protected from cleaning",
                max_scan_depth: "Maximum Scan Depth",
                max_scan_depth_desc: "Set the maximum depth for scanning folders (0 means unlimited)",
                exclude_hidden: "Exclude Hidden Files",
                exclude_hidden_desc: "Whether to exclude hidden files and folders during scanning",
                min_file_size: "Minimum File Size (bytes)",
                min_file_size_desc: "Only scan files larger than this size (0 means scan all files)",
                reset_settings: "Reset Settings",
                reset_settings_desc: "Reset all settings to default values",
                add_extension: "Add",
                extension_placeholder: "Enter new extension (e.g.: .txt)"
            },
            messages: {
                scan_started: "Starting file scan...",
                scan_failed: "Scan failed: {{error}}",
                no_items_found: "No files found that need cleaning",
                items_found: "Found {{count}} items that need cleaning",
                select_items_first: "Please select items to delete first",
                deleting: "Deleting files...",
                delete_success: "Successfully deleted {{count}} items",
                delete_partial: "Deletion completed with {{errorCount}} errors",
                delete_failed: "Deletion failed: {{error}}"
            },
            languages: {
                'zh-CN': "中文",
                'en-US': "English"
            }
        };
    }

    /**
     * 获取当前语言
     */
    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    /**
     * 设置当前语言
     */
    setLanguage(language: SupportedLanguage): void {
        if (this.currentLanguage !== language) {
            this.currentLanguage = language;
            this.notifyLanguageChange(language);
        }
    }

    /**
     * 获取翻译文本
     * 支持嵌套路径，如 'ui.title' 或 'settings.language'
     * 支持参数替换，如 '{count}' 会被替换为传入的参数值
     */
    t(key: string, params?: Record<string, string | number>): string {
        const resource = this.languageResources.get(this.currentLanguage);
        if (!resource) {
            console.warn(`Language resource not found for ${this.currentLanguage}`);
            return key;
        }

        // 解析嵌套路径
        const keys = key.split('.');
        let value: any = resource;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key}`);
            return key;
        }

        // 参数替换 - 支持 {{param}} 格式
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                return params[paramKey]?.toString() || match;
            });
        }

        return value;
    }

    /**
     * 获取所有支持的语言列表
     */
    getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
        return [
            { code: 'zh-CN', name: this.t('languages.zh-CN') },
            { code: 'en-US', name: this.t('languages.en-US') }
        ];
    }

    /**
     * 注册语言变更回调
     */
    onLanguageChange(callback: (language: SupportedLanguage) => void): void {
        this.onLanguageChangeCallbacks.push(callback);
    }

    /**
     * 移除语言变更回调
     */
    offLanguageChange(callback: (language: SupportedLanguage) => void): void {
        const index = this.onLanguageChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.onLanguageChangeCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知语言变更
     */
    private notifyLanguageChange(language: SupportedLanguage): void {
        this.onLanguageChangeCallbacks.forEach(callback => {
            try {
                callback(language);
            } catch (error) {
                console.error('Error in language change callback:', error);
            }
        });
    }

    /**
     * 销毁管理器，清理资源
     */
    destroy(): void {
        this.onLanguageChangeCallbacks.length = 0;
        this.languageResources.clear();
    }
}