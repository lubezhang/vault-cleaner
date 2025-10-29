/**
 * 扫描项目类型定义
 */
export interface ScanItem {
    path: string;
    name: string;
    type: 'file' | 'directory';
    size?: number;
    selected?: boolean;
}

/**
 * 扫描结果
 */
export interface ScanResult {
    emptyDirectories: ScanItem[];
    unlinkedFiles: ScanItem[];
    totalCount: number;
    totalSize: number;
}

/**
 * 删除结果
 */
export interface DeleteResult {
    success: boolean;
    deletedItems: string[];
    failedItems: string[];
    errors: string[];
}

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'zh-CN' | 'en-US';

/**
 * 插件设置接口
 */
export interface CleanFilesSettings {
    cleanableExtensions: string[];
    protectedExtensions: string[];
    maxScanDepth: number;
    excludeHidden: boolean;
    minFileSize: number;
    language: SupportedLanguage;
}

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: CleanFilesSettings = {
    cleanableExtensions: [
        '.*',
    ],
    protectedExtensions: [
        '.md', '.canvas', '.base'
    ],
    maxScanDepth: 10,
    excludeHidden: true,
    minFileSize: 0,
    language: 'zh-CN'
};



/**
 * 扫描配置
 */
export interface ScanConfig {
    maxDepth: number;
    excludeHidden: boolean;
    minFileSize: number;
}