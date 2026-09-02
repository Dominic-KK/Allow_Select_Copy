// ==UserScript==
// @name                 🌹允许复制🌹
// @name:zh-CN           🌹允许复制🌹
// @name:en              🌹Allow Select & Copy🌹
// @namespace            https://dominickk.top/
// @version              0.0.1
// @tag                  @Dominic🌹 浏览器插件 允许复制 允许选择
// @author               Dominic KK🌹
// @description          支持通过CSS允许选择、通过影响监听器等方案实现允许选择和复制，可保存配置，单次生效/全局生效。
// @description:zh-CN    支持通过CSS允许选择、通过影响监听器等方案实现允许选择和复制，可保存配置，单次生效/全局生效。
// @description:en       It supports allowing selection and copying through CSS, influencing listeners, and other schemes. Configurations can be saved and effective once/globally.
// @license              AGPL-3.0-only
// @homepage             https://www.dominickk.top/
// @homepageURL          https://www.dominickk.top/
// @support              https://github.com/Dominic-KK/Allow_Select_Copy/issues
// @supportURL           https://github.com/Dominic-KK/Allow_Select_Copy/issues
// @match                *://*/*
// @connect              *://*/*
// @require              https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @grant                GM_registerMenuCommand
// @grant                GM_unregisterMenuCommand
// @grant                GM_getValue
// @grant                GM_setValue
// @compatible	         Chrome
// @compatible	         Edge
// @compatible	         Firefox
// @compatible	         Safari
// @compatible	         Opera
// ==/UserScript==
/* ==UserConfig==
modes:
  allowSelect_CSS:
    title: CSS允许选择 (全局有效)
    description: 仅通过user-select:auto允许选择，不处理事件阻止
    type: checkbox
    default: false
  allowSelect:
    title: 允许选择 (全局有效)
    description: 允许选择（含selectstart/mousedown事件阻止处理）
    type: checkbox
    default: false
  allowCopy:
    title: 允许复制 (全局有效)
    description: 允许复制（含copy/cut事件阻止处理）
    type: checkbox
    default: false
 ==/UserConfig== */
/**
 * CSS允许选择：将user-select设置为auto，允许选择但不处理事件阻止
 * 允许选择：设置user-select为auto，并移除selectstart和mousedown事件阻止
 * 允许复制：设置user-select为auto，并移除copy和cut事件阻止
 * 强制允许选择：激进地重置样式，确保选择功能可用，可能影响页面布局
 * 强制允许复制：激进地重置样式，确保复制功能可用，可能影响页面布局
 */
(function() {
    'use strict';
    // 暴露变量方便调试
    (window.unsafeWindow || window).CAT_UI = CAT_UI;

    /**
     * 用脚本猫UI库替换浏览器alert，避免弹出阻塞式原生对话框
     * @param {string} content 提示内容
     * @param {'success'|'warning'} type 提示类型
     */
    const notify = (content, type = 'success') => {
        // React 18渲染规则：顶级调用Message需异步，故用setTimeout包裹
        setTimeout(() => {
            if (type === 'warning') {
                CAT_UI.Message.warning(content);
            } else {
                CAT_UI.Message.success(content);
            }
        }, 0);
    };

    // 存储已注册的菜单命令ID，用于后续管理
    let menuCommands = {
        allowSelect_CSS: null,
        allowSelect: null,
        allowCopy: null,
        forceAllowSelect: null,
        forceAllowCopy: null,
    };
    // 存储原始样式，用于恢复页面原始状态
    let originalStyles = [];
    // 存储原始事件监听器，用于恢复页面原始事件处理
    let originalEventListeners = [];
    // 注册所有菜单命令到Tampermonkey菜单
    function registerMenuCommands() {
        menuCommands.allowSelect_CSS = GM_registerMenuCommand('🌹CSS允许选择 (单次有效)', allowSelect_CSS);
        menuCommands.allowSelect = GM_registerMenuCommand('🌹允许选择 (单次有效)', allowSelect);
        menuCommands.allowCopy = GM_registerMenuCommand('🌹允许复制 (单次有效)', allowCopy);
        menuCommands.forceAllowSelect = GM_registerMenuCommand('🌹强制允许选择 (单次有效)', forceAllowSelect);
        menuCommands.forceAllowCopy = GM_registerMenuCommand('🌹强制允许复制 (单次有效)', forceAllowCopy);
    }

    /**
     * 移除所有通过脚本添加的样式
     * 用于在切换模式前清理之前添加的样式，避免样式冲突
     */
    function removeAddedStyles() {
        // 遍历所有添加的样式元素
        originalStyles.forEach(style => {
            // 检查样式元素是否仍在DOM中
            if (document.head.contains(style)) {
                // 从head中移除样式元素
                document.head.removeChild(style);
            }
        });
        // 清空样式数组
        originalStyles = [];
    }
    /**
     * 恢复原始的事件监听器
     * 用于撤销对事件系统的修改，恢复页面原始行为
     */
    function restoreEventListeners() {
        // 检查是否有需要恢复的事件监听器
        if (originalEventListeners.length > 0) {
            // 遍历所有存储的原始事件处理方法
            originalEventListeners.forEach(item => {
                // 将重写的方法恢复为原始方法
                item.target[item.method] = item.original;
            });
            // 清空事件监听器数组
            originalEventListeners = [];
        }
    }
    /** 注入允许选择的通用样式（user-select: auto） */
    function injectAllowSelectStyle() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                user-select: auto !important;
                -webkit-user-select: auto !important;
                -moz-user-select: auto !important;
                -ms-user-select: auto !important;
            }
        `;
        document.head.appendChild(style);
        originalStyles.push(style);
    }

    function applyCssSelect() {
        injectAllowSelectStyle();
    }
    function applySelect() {
        injectAllowSelectStyle();
        // 移除选择开始事件阻止（常见的选择限制事件）
        document.addEventListener('selectstart', function(e) {
            e.stopPropagation();
        }, true);
        // 移除鼠标按下事件阻止（某些网站通过阻止mousedown来限制选择）
        document.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        }, true);
    }
    function applyCopy() {
        injectAllowSelectStyle();
        // 移除复制相关的事件阻止 - 使用事件捕获阶段拦截
        document.addEventListener('copy', function(e) {
            e.stopPropagation();
        }, true);
        // 移除剪切相关的事件阻止
        document.addEventListener('cut', function(e) {
            e.stopPropagation();
        }, true);
    }

    function allowSelect_CSS() {
        removeAddedStyles();
        restoreEventListeners();
        applyCssSelect();
        // GM_setValue('modes.allowSelect_CSS', true);
        // notify('已启用 CSS允许选择');
        notify('🌹已启用CSS允许选择（单次有效，刷新页面后失效）');
    }
    function allowSelect() {
        removeAddedStyles();
        restoreEventListeners();
        applySelect();
        // GM_setValue('modes.allowSelect', true);
        // notify('已启用 允许选择（单次有效，刷新页面后失效）');
        notify('🌹已启用允许选择（单次有效，刷新页面后失效）');
    }
    function allowCopy() {
        removeAddedStyles();
        restoreEventListeners();
        applyCopy();
        // GM_setValue('modes.allowCopy', true);
        // notify('已启用 允许复制（单次有效，刷新页面后失效）');
        notify('🌹已启用允许复制（单次有效，刷新页面后失效）');   
    }

    /** 启动时根据用户配置恢复开启状态 */
    function applySavedConfig() {
        removeAddedStyles();
        restoreEventListeners();
        if (GM_getValue('modes.allowSelect_CSS', false)) applyCssSelect();
        if (GM_getValue('modes.allowSelect', false)) applySelect();
        if (GM_getValue('modes.allowCopy', false)) applyCopy();
    }
    function forceAllowSelect() {
        removeAddedStyles();
        restoreEventListeners();
        const style = document.createElement('style');
        style.textContent = `
            * {
                user-select: auto !important;
                -webkit-user-select: auto !important;
                -moz-user-select: auto !important;
                -ms-user-select: auto !important;
                pointer-events: auto !important;
                -webkit-touch-callout: default !important;
            }
            body {
                all: initial !important;
            }
            body * {
                all: unset !important;
                display: block !important;
            }
        `;
        document.head.appendChild(style);
        originalStyles.push(style);
        // 重写可能影响选择的事件监听器
        overrideEventListeners(['selectstart', 'mousedown', 'mouseup', 'dragstart']);
        notify('🌹已启用强制允许选择，可能会影响页面样式与功能。', 'warning');
    }
    function forceAllowCopy() {
        removeAddedStyles();
        restoreEventListeners();
        const style = document.createElement('style');
        style.textContent = `
            * {
                user-select: auto !important;
                -webkit-user-select: auto !important;
                -moz-user-select: auto !important;
                -ms-user-select: auto !important;
                pointer-events: auto !important;
                -webkit-touch-callout: default !important;
            }
            body {
                all: initial !important;
            }
            body * {
                all: unset !important;
                display: block !important;
            }
        `;
        document.head.appendChild(style);
        originalStyles.push(style);
        // 重写事件监听器
        overrideEventListeners(['copy', 'cut', 'contextmenu']);
        notify('🌹已启用强制复制模式，可能会影响页面样式与功能。', 'warning');
    }

    /**
     * 重写事件监听器以阻止特定事件的限制
     * @param {string[]} events - 需要阻止的事件类型数组
     */
    function overrideEventListeners(events) {
        // 保存原始的addEventListener方法
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        // 记录原始方法以便恢复
        originalEventListeners.push({
            target: EventTarget.prototype,        // 目标对象
            method: 'addEventListener',           // 方法名  
            original: originalAddEventListener    // 原始方法引用
        });
        // 重写addEventListener方法
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // 如果是要阻止的事件类型，直接返回（不注册监听器）
            if (events.includes(type)) {
                console.log('Blocked event listener for:', type);
                return;
            }
            // 对于其他事件，使用原始方法正常注册
            originalAddEventListener.call(this, type, listener, options);
        };
    }

    // 脚本初始化：注册所有菜单命令，并根据用户配置恢复开启状态
    registerMenuCommands();
    applySavedConfig();
    
})();