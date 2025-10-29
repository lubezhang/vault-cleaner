import { TFile, TFolder, Vault, App } from 'obsidian';
import { ScanItem, ScanResult, ScanConfig, CleanFilesSettings } from './types';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';

/**
 * 文件扫描服务
 */
export class FileScanner {
    private vault: Vault;
    private vaultPath: string;
    private app: App;
    private settings: CleanFilesSettings;

    constructor(app: App, vaultPath: string, settings: CleanFilesSettings) {
        this.app = app;
        this.vault = app.vault;
        this.vaultPath = vaultPath;
        this.settings = settings;
    }

    /**
     * 更新设置
     */
    updateSettings(settings: CleanFilesSettings) {
        this.settings = settings;
    }

    /**
     * 扫描空目录和无关联文件
     * 根据用户配置过滤文件，检测空目录和没有引用的文件
     */
    async scanFiles(config?: Partial<ScanConfig>): Promise<ScanResult> {
        const scanConfig: ScanConfig = {
            maxDepth: config?.maxDepth ?? this.settings.maxScanDepth,
            excludeHidden: config?.excludeHidden ?? this.settings.excludeHidden,
            minFileSize: config?.minFileSize ?? this.settings.minFileSize
        };

        const emptyDirectories: ScanItem[] = [];
        const unlinkedFiles: ScanItem[] = [];

        try {
            // 扫描空目录 - 查找完全为空的目录
            await this.scanEmptyDirectories(this.vaultPath, emptyDirectories, scanConfig, 0);
            
            // 扫描无关联文件 - 根据配置和引用情况查找可清理的文件
            await this.scanUnlinkedFiles(this.vaultPath, unlinkedFiles, scanConfig, 0);

            const totalSize = [...emptyDirectories, ...unlinkedFiles]
                .reduce((sum, item) => sum + (item.size || 0), 0);

            return {
                emptyDirectories,
                unlinkedFiles,
                totalCount: emptyDirectories.length + unlinkedFiles.length,
                totalSize
            };
        } catch (error) {
            console.error('扫描文件时出错:', error);
            throw new Error(`扫描失败: ${error.message}`);
        }
    }

    /**
     * 扫描空目录
     */
    private async scanEmptyDirectories(
        dirPath: string, 
        result: ScanItem[], 
        config: ScanConfig, 
        depth: number
    ): Promise<void> {
        if (depth >= config.maxDepth) return;

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // 过滤隐藏文件夹
            const filteredEntries = config.excludeHidden 
                ? entries.filter(entry => !entry.name.startsWith('.'))
                : entries;

            const directories = filteredEntries.filter(entry => entry.isDirectory());
            
            for (const dir of directories) {
                const fullPath = join(dirPath, dir.name);
                const relativePath = this.getRelativePath(fullPath);
                
                // 检查是否为空目录
                if (await this.isEmptyDirectory(fullPath, config)) {
                    result.push({
                        path: relativePath,
                        name: dir.name,
                        type: 'directory',
                        size: 0,
                        selected: false
                    });
                } else {
                    // 递归扫描子目录
                    await this.scanEmptyDirectories(fullPath, result, config, depth + 1);
                }
            }
        } catch (error) {
            console.warn(`无法访问目录 ${dirPath}:`, error.message);
        }
    }

    /**
     * 扫描无关联文件
     */
    private async scanUnlinkedFiles(
        dirPath: string, 
        result: ScanItem[], 
        config: ScanConfig, 
        depth: number
    ): Promise<void> {
        if (depth >= config.maxDepth) return;

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // 过滤隐藏文件
            const filteredEntries = config.excludeHidden 
                ? entries.filter(entry => !entry.name.startsWith('.'))
                : entries;

            for (const entry of filteredEntries) {
                const fullPath = join(dirPath, entry.name);
                const relativePath = this.getRelativePath(fullPath);

                if (entry.isDirectory()) {
                    // 递归扫描子目录
                    await this.scanUnlinkedFiles(fullPath, result, config, depth + 1);
                } else if (entry.isFile()) {
                    // 检查是否为无关联文件
                    if (await this.isUnlinkedFile(fullPath, entry.name, config)) {
                        const stats = await fs.stat(fullPath);
                        result.push({
                            path: relativePath,
                            name: entry.name,
                            type: 'file',
                            size: stats.size,
                            selected: false
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`无法访问目录 ${dirPath}:`, error.message);
        }
    }

    /**
     * 检查是否为空目录
     */
    private async isEmptyDirectory(dirPath: string, config: ScanConfig): Promise<boolean> {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // 过滤隐藏文件
            const filteredEntries = config.excludeHidden 
                ? entries.filter(entry => !entry.name.startsWith('.'))
                : entries;

            return filteredEntries.length === 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * 检查是否为无关联文件
     * 通过用户配置和引用检测来判断文件是否可以清理
     */
    private async isUnlinkedFile(filePath: string, fileName: string, config: ScanConfig): Promise<boolean> {
        const ext = extname(fileName).toLowerCase();
        
        // 1. 检查文件大小 - 小于最小文件大小的文件不处理
        try {
            const stats = await fs.stat(filePath);
            if (stats.size < config.minFileSize) {
                return false;
            }
        } catch (error) {
            return false;
        }

        // 2. 优先检查保护扩展名列表 - 如果在保护列表中，直接跳过
        if (this.settings.protectedExtensions.includes(ext)) {
            return false;
        }

        // 3. 检查可清理扩展名列表 - 如果在可清理列表中，直接标记为可清理
        if (this.settings.cleanableExtensions.includes(ext) || this.settings.cleanableExtensions.includes(fileName)) {
            return true;
        }

        // 4. 对于其他文件，检查是否被Obsidian引用
        // 如果文件被引用，则不是无关联文件（返回false）
        // 如果文件没有被引用，则是无关联文件（返回true，可以清理）
        const isReferenced = this.isReferencedByObsidian(filePath);
        return !isReferenced;
    }

    /**
     * 检查文件是否被Obsidian引用
     * 通过多种方式检测文件是否被其他文件引用或使用
     */
    private isReferencedByObsidian(filePath: string): boolean {
        const relativePath = this.getRelativePath(filePath);
        
        // 1. 检查文件是否在vault的文件系统中
        const file = this.vault.getAbstractFileByPath(relativePath);
        if (!(file instanceof TFile)) {
            // 如果不是TFile，可能是外部文件，需要进一步检查
            return this.checkExternalFileReferences(relativePath);
        }

        // 2. 检查文件的元数据缓存
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache) {
            // 检查文件内部是否有链接或嵌入（说明文件有内容结构）
            if (cache.links?.length > 0 || cache.embeds?.length > 0) {
                return true;
            }
        }

        // 3. 检查是否有其他文件引用此文件（通过反向链接）
        // 使用app.metadataCache来检查反向链接
        const allFiles = this.vault.getMarkdownFiles();
        for (const sourceFile of allFiles) {
            const sourceCache = this.app.metadataCache.getFileCache(sourceFile);
            if (sourceCache) {
                // 检查链接
                if (sourceCache.links) {
                    for (const link of sourceCache.links) {
                        if (link.link === relativePath || link.link === file.basename) {
                            return true;
                        }
                    }
                }
                // 检查嵌入
                if (sourceCache.embeds) {
                    for (const embed of sourceCache.embeds) {
                        if (embed.link === relativePath || embed.link === file.basename) {
                            return true;
                        }
                    }
                }
            }
        }

        // 4. 检查是否有文件嵌入此文件
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        for (const sourceFile in resolvedLinks) {
            const links = resolvedLinks[sourceFile];
            if (links && links[relativePath]) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查外部文件的引用情况
     * 对于不在vault文件系统中的文件，检查是否被引用
     */
    private checkExternalFileReferences(relativePath: string): boolean {
        // 检查所有已解析的链接中是否包含此文件
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        for (const sourceFile in resolvedLinks) {
            const links = resolvedLinks[sourceFile];
            if (links && links[relativePath]) {
                return true;
            }
        }

        // 检查未解析的链接
        const unresolvedLinks = this.app.metadataCache.unresolvedLinks;
        for (const sourceFile in unresolvedLinks) {
            const links = unresolvedLinks[sourceFile];
            if (links && links[relativePath]) {
                return true;
            }
        }

        return false;
    }

    /**
     * 获取相对于vault的路径
     */
    private getRelativePath(fullPath: string): string {
        return fullPath.replace(this.vaultPath, '').replace(/^[\/\\]/, '');
    }

    /**
     * 删除选中的项目
     */
    async deleteItems(items: ScanItem[]): Promise<{ success: boolean; errors: string[] }> {
        const errors: string[] = [];
        
        for (const item of items) {
            if (!item.selected) continue;
            
            try {
                const fullPath = join(this.vaultPath, item.path);
                
                if (item.type === 'directory') {
                    await fs.rmdir(fullPath);
                } else {
                    await fs.unlink(fullPath);
                }
            } catch (error) {
                errors.push(`删除 ${item.path} 失败: ${error.message}`);
            }
        }

        return {
            success: errors.length === 0,
            errors
        };
    }
}