/**
 * cus_umytable v1.0.1 - 原生JS透视表插件
 * @author duanZhongLin <acduan@163.com>
 * @license MIT
 * @description 基于App.vue全部功能，用原生JS实现的透视表插件
 * 
 * 使用方法:
 *   const table = new CusUmyTable('#container', {
 *       dataUrl: './report_data2.json'
 *   });
 */
(function(global) {
    'use strict';

    class CusUmyTable {
        /**
         * @param {string|HTMLElement} container - 容器选择器或DOM元素
         * @param {object} options - 配置选项
         */
        constructor(container, options = {}) {
            this.container = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            if (!this.container) {
                throw new Error('CusUmyTable: 容器不存在');
            }

            // 默认配置
            this.options = Object.assign({
                dataUrl: '',
                autoLoad: true,
                showToolbar: true,
                showConfig: false,
                size: 'small'         // 'medium' | 'small' | 'mini'
            }, options);

            // 核心数据
            this.rawData = { datalist: [], report_descript: {} };
            this.reportinfo = {};
            this.rsp_datalist = [];
            this.rsp_datalist_initial = [];
            this.mergedDataMap = new Map();
            this.ColumnValues = {};

            // 报表配置
            this.report_type = 'summary';
            this.elradio_tableType = 'summary';
            this.elradio_contentType = 'grid';
            this.elradio_isShow_ColSubtotal = 'false';
            this.elradio_isShow_ColAlltotal = 'false';
            this.elradio_rowSubtotalStyle = 'simple';
            this.enableMergeData = 'true'; // 数据聚合开关：true=先 _mergeData 扁平聚合再建树；false=直接建树（高基数字段场景）
            this.ipt_rowSubtotal_numberColumns = 0;
            this.rowSubtotal_numberColumns_max = 0;
            this.orderby_fields = {};
            this.elradio_separator = 'false';
            this.ipt_decimalPlaces = 2;
            this.elradio_autoFrozenCols = 'false';
            this.frozenCols = 1;
            this.isShow_frozenCols = false;
            this.isShow_treelevel = false;
            this.expandTreelevel = 1;
            this._expandedTreeKeys = new Set(); // 用户手动展开的节点key集合，持久化跨刷新
            this.size_style = this.options.size;
            this.elradio_size = this.options.size;

            // 字段列表
            this.rows_fieldList = [];
            this.cols_fieldList = [];
            this.numerics_fieldlist = [];
            this.hide_fieldslist = [];
            this.groupNumerics_fieldlist = [];
            this.groupNumerics_list = [];
            this.groupNumerics_map = new Map();

            // UI状态
            this.isShow_drag = this.options.showConfig;
            this.filter_fieldlist = {};
            this.rpt_des_name = '';
            this.rpt_des_remark = '';
            this.cells_merge = [];
            this.arr_filter_vals = [];
            this.ux_grid_columns = [];
            this.ux_grid_header = [];
            this.ux_grid_datas = [];
            this.ux_grid_treeData = [];
            this.ux_grid_treeConfig = null;
            this.expandTreeNodes = [];

            // 筛选面板
            this.sel_columns = [];
            this.sel_colIndex = 0;
            this.sel_tagtext = '';
            this.sel_divIsShow = false;
            this.filter_sort_mode = 'asc';  // 'asc' | 'desc' | 'count'
            this.filter_value_counts = {};   // 每个值的出现次数

            // 列宽拖拽
            this.columnWidths = {};          // { fieldName: widthPx } 存储自定义列宽

            // 虚拟滚动
            this._virtualEnabled = true;      // 是否启用虚拟滚动
            this._rowHeight = 28;            // 预估行高（动态计算）
            this._bufferCount = 20;          // 上下缓冲行数
            this._virtualStartIdx = 0;       // 当前渲染起始行索引
            this._virtualEndIdx = 0;         // 当前渲染结束行索引
            this._virtualScrollRAF = null;   // requestAnimationFrame id
            this._lastScrollTop = 0;         // 上次滚动位置

            // 模板（结构与 App.vue 一致，含"系统默认"项）
            this.custom_templates = [{
                label: '系统默认',
                value: '系统默认',
                checked: true,
            }];
            this.sel_templateName = '系统默认';
            this.ipt_templateName = '';

            // 初始化
            this._buildDOM();
            this._bindEvents();
            if (this.options.autoLoad && this.options.dataUrl) {
                this.loadData(this.options.dataUrl);
            }
        }

        // ==================== SVG 图标库 ====================
        _icon(name) {
            // 24x24 viewBox, currentColor, 简洁线性图标
            const I = {
                printer: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 9V3h10v6h2a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2h2zm2 0h6V5H9v4zm-4 4v4h2v-2h10v2h2v-4H5z"/></svg>',
                download: '<svg class="ico" viewBox="0 0 24 24"><path d="M11 3h2v9.59l3.3-3.3 1.4 1.42L12 16.41 6.3 10.71l1.4-1.42 3.3 3.3V3zM5 18h14v2H5v-2z"/></svg>',
                gear: '<svg class="ico" viewBox="0 0 24 24"><path d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.66 8.48a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88L2.78 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.61.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.18.12.47.02.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',
                eye: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
                caret_down: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>',
                caret_right: '<svg class="ico" viewBox="0 0 24 24"><path d="M10 7l5 5-5 5z"/></svg>',
                caret_up: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>',
                close: '<svg class="ico" viewBox="0 0 24 24"><path d="M18.3 5.71L12 12.01l-6.3-6.3-1.42 1.41 6.3 6.3-6.3 6.3 1.42 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z"/></svg>',
                file: '<svg class="ico" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 7V3.5L19.5 9H14z"/></svg>',
                pencil: '<svg class="ico" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
                upload: '<svg class="ico" viewBox="0 0 24 24"><path d="M11 16.41V7.83l-3.3 3.3-1.42-1.42L12 4l5.71 5.71-1.42 1.42-3.29-3.3v8.58h-2zM5 19h14v2H5v-2z"/></svg>',
                minus: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg>',
                plus: '<svg class="ico" viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
                funnelsm: '<svg class="ico" viewBox="0 0 24 24" style="width:10px;height:10px"><path d="M4 5h16l-6 8v6l-4-2v-4z"/></svg>',
            };
            return I[name] || '';
        }

        // ==================== DOM构建 ====================
        _buildDOM() {
            const html = `
            <div class="cus_umytable_wrapper size_${this.size_style}">
                ${this._buildToolbarHTML()}
                ${this._buildConfigPanelHTML()}
                <div class="cus_umytable_filter_panel" id="cus_filter_panel">
                    <div class="filter_sort_bar" id="cus_filter_sort_bar">
                        <span class="filter_sort_label">排序:</span>
                        <button class="filter_sort_btn active" id="cus_filter_sort_asc" data-sort="asc" title="升序 A→Z">↑ A-Z</button>
                        <button class="filter_sort_btn" id="cus_filter_sort_desc" data-sort="desc" title="降序 Z→A">↓ Z-A</button>
                        <button class="filter_sort_btn" id="cus_filter_sort_count" data-sort="count" title="按数量排序"># 数量</button>
                    </div>
                    <input type="text" class="filter_search" placeholder="搜索..." id="cus_filter_search">
                    <div class="filter_checkall">
                        <label><input type="checkbox" id="cus_filter_checkall"> 全选</label>
                    </div>
                    <div class="filter_list" id="cus_filter_list"></div>
                    <div class="filter_btns">
                        <button id="cus_filter_reset">重置</button>
                        <button class="primary" id="cus_filter_confirm">筛选</button>
                    </div>
                </div>
                <div class="cus_umytable_title" id="cus_title"></div>
                <div class="cus_umytable_remark" id="cus_remark"></div>
                <div class="cus_umytable_table_wrapper" id="cus_table_wrapper">
                    <div class="cus_umytable_loading" id="cus_loading">
                        <div class="loading_spinner"></div>
                    </div>
                    <table class="cus_umytable_table" id="cus_table">
                        <thead></thead>
                        <tfoot></tfoot>
                        <tbody>
                            <tr class="virtual_spacer_top" id="cus_virtual_spacer_top"><td></td></tr>
                            <tr class="virtual_spacer_bottom" id="cus_virtual_spacer_bottom"><td></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
            this.container.innerHTML = html;

            // 缓存DOM引用
            this.$ = {
                wrapper: this.container.querySelector('.cus_umytable_wrapper'),
                configPanel: this.container.querySelector('#cus_config_panel'),
                filterPanel: this.container.querySelector('#cus_filter_panel'),
                filterSearch: this.container.querySelector('#cus_filter_search'),
                filterCheckAll: this.container.querySelector('#cus_filter_checkall'),
                filterList: this.container.querySelector('#cus_filter_list'),
                title: this.container.querySelector('#cus_title'),
                remark: this.container.querySelector('#cus_remark'),
                tableWrapper: this.container.querySelector('#cus_table_wrapper'),
                table: this.container.querySelector('#cus_table'),
                thead: this.container.querySelector('#cus_table thead'),
                tfoot: this.container.querySelector('#cus_table tfoot'),
                tbody: this.container.querySelector('#cus_table tbody'),
                spacerTop: this.container.querySelector('#cus_virtual_spacer_top'),
                spacerBottom: this.container.querySelector('#cus_virtual_spacer_bottom'),
                loading: this.container.querySelector('#cus_loading'),
            };
        }

        _renderTitle() {
            if (this.$.title) this.$.title.innerHTML = this.rpt_des_name || '';
            if (this.$.remark) {
                let html = '<span class="remark_text">' + (this.rpt_des_remark || '') + '</span>';
                if (this._queryTime) {
                    html += '<span class="remark_time">查询时间：' + this._queryTime + '</span>';
                }
                this.$.remark.innerHTML = html;
            }
        }

        _buildToolbarHTML() {
            if (!this.options.showToolbar) return '';
            return `
    <div class="cus_umytable_toolbar">
        <button class="tool_btn" id="cus_btn_print" title="打印">${this._icon('printer')} 打印</button>
        <button class="tool_btn" id="cus_btn_export" title="导出Excel">${this._icon('download')} 导出excel</button>
        <button class="tool_btn" id="cus_btn_config" title="自定义配置">${this._icon('gear')} <span id="cus_btn_config_text">隐藏自定义</span></button>
        <span class="tool_sep"></span>
        <div class="tpl_wrap" id="cus_tpl_wrap" title="选择偏好">
            <span class="tpl_label">${this._icon('eye')} <span id="cus_tpl_label_text">系统默认</span> ${this._icon('caret_down')}</span>
            <select id="cus_template_select">
                <option value="系统默认">系统默认</option>
            </select>
        </div>
    </div>`;
        }

        _buildConfigPanelHTML() {
            return `
    <div class="cus_umytable_config_panel${this.isShow_drag ? ' show' : ''}" id="cus_config_panel">
        <!-- 操作项 -->
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">操作项</span>
            <div class="ops_links">
                <button class="op_link" id="cus_btn_props">${this._icon('file')} 条件属性</button>
                <span class="op_sep"></span>
                <button class="op_link" id="cus_btn_save_template">${this._icon('pencil')} 保存偏好</button>
                <span class="op_sep"></span>
                <button class="op_link" id="cus_btn_export_template">${this._icon('download')} 导出偏好</button>
                <span class="op_sep"></span>
                <button class="op_link" id="cus_btn_import_template">${this._icon('upload')} 导入偏好</button>
                <input type="file" id="cus_ipt_import_file" accept="application/json" style="display:none">
            </div>
        </div>
        <!-- 表类型 + 表样式 -->
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">表类型</span>
            <div class="cfg_radio_group" id="cus_radio_tableType">
                <label data-val="summary" class="active">汇总</label>
                <label data-val="detail">明细</label>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">表样式</span>
            <div class="cfg_radio_group" id="cus_radio_contentType">
                <label data-val="grid" class="active">网格</label>
                <label data-val="tree">树状</label>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">数据聚合</span>
            <div class="cfg_radio_group" id="cus_radio_merge">
                <label data-val="true" class="active">启用</label>
                <label data-val="false">关闭</label>
            </div>
            <span id="cus_treelevel_area" style="display:none; margin-left:14px;">
                <span class="cfg_label">展开级数</span>
                <div class="cfg_stepper">
                    <button class="step_btn minus" data-target="cus_ipt_treelevel" data-step="-1">${this._icon('minus')}</button>
                    <input type="number" id="cus_ipt_treelevel" value="1" min="1" max="100" step="1" data-stepper="1">
                    <button class="step_btn plus" data-target="cus_ipt_treelevel" data-step="1">${this._icon('plus')}</button>
                </div>
            </span>
        </div>
        <!-- 列小计 / 列总计 / 合并列 / 行小计 -->
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">列小计</span>
            <div class="cfg_radio_group" id="cus_radio_colSubtotal">
                <label data-val="true">显示</label>
                <label data-val="false" class="active">隐藏</label>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">列总计</span>
            <div class="cfg_radio_group" id="cus_radio_colAlltotal">
                <label data-val="true">显示</label>
                <label data-val="false" class="active">隐藏</label>
            </div>
            <span class="cfg_label" style="margin-left:18px;">合并至几列</span>
            <div class="cfg_stepper">
                <button class="step_btn minus" data-target="cus_ipt_rowSubtotalCols" data-step="-1">${this._icon('minus')}</button>
                <input type="number" id="cus_ipt_rowSubtotalCols" value="0" min="0" max="10" step="1" data-stepper="1">
                <button class="step_btn plus" data-target="cus_ipt_rowSubtotalCols" data-step="1">${this._icon('plus')}</button>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">行小计</span>
            <div class="cfg_radio_group" id="cus_radio_rowSubtotal">
                <label data-val="default">常规</label>
                <label data-val="simple" class="active">精简</label>
                <label data-val="none">无行小计</label>
            </div>
        </div>
        <!-- 字号 / 千分位 / 小数位 / 冻结列 -->
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">字大小</span>
            <div class="cfg_segment_group" id="cus_radio_size">
                <label data-val="medium">大号</label>
                <label data-val="small" class="active">中号</label>
                <label data-val="mini">小号</label>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">千分位</span>
            <div class="cfg_radio_group" id="cus_radio_separator">
                <label data-val="true">显示</label>
                <label data-val="false" class="active">隐藏</label>
            </div>
            <span class="cfg_label" style="margin-left:18px;">小数保留位</span>
            <div class="cfg_stepper">
                <button class="step_btn minus" data-target="cus_ipt_decimal" data-step="-1">${this._icon('minus')}</button>
                <input type="number" id="cus_ipt_decimal" value="2" min="0" max="8" step="1" data-stepper="1">
                <button class="step_btn plus" data-target="cus_ipt_decimal" data-step="1">${this._icon('plus')}</button>
            </div>
            <span class="cfg_label colon" style="margin-left:18px;">列冻结</span>
            <div class="cfg_radio_group" id="cus_radio_frozen">
                <label data-val="true">启用</label>
                <label data-val="false" class="active">关闭</label>
            </div>
            <span id="cus_frozen_count_area" style="display:none; margin-left:14px;">
                <span class="cfg_label">冻结列数</span>
                <div class="cfg_stepper">
                    <button class="step_btn minus" data-target="cus_ipt_frozenCols" data-step="-1">${this._icon('minus')}</button>
                    <input type="number" id="cus_ipt_frozenCols" value="1" min="1" max="10" step="1" data-stepper="1">
                    <button class="step_btn plus" data-target="cus_ipt_frozenCols" data-step="1">${this._icon('plus')}</button>
                </div>
            </span>
        </div>
        <!-- 拖拽区域 -->
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">数据行</span>
            <div class="cus_umytable_drag_zone" id="cus_drag_rows"></div>
        </div>
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">数据列</span>
            <div class="cus_umytable_drag_zone" id="cus_drag_cols"></div>
        </div>
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">数值项</span>
            <div class="cus_umytable_drag_zone" id="cus_drag_numerics"></div>
        </div>
        <div class="cus_umytable_config_row">
            <span class="cfg_label colon">待选项</span>
            <div class="cus_umytable_drag_zone" id="cus_drag_hide"></div>
        </div>
    </div>`;
        }

        // ==================== 事件绑定 ====================
        _bindEvents() {
            const self = this;

            // 打印
            this._on('cus_btn_print', 'click', () => this.print());
            // 导出
            this._on('cus_btn_export', 'click', () => this.exportExcel());
            // 配置面板切换
            this._on('cus_btn_config', 'click', () => {
                self.isShow_drag = !self.isShow_drag;
                self.$.configPanel.classList.toggle('show', self.isShow_drag);
                const btnText = self.container.querySelector('#cus_btn_config_text');
                if (btnText) btnText.textContent = self.isShow_drag ? '隐藏自定义' : '自定义';
                self._updateTableHeight();
            });

            // 筛选面板
            this._on('cus_filter_search', 'input', (e) => this._filterSearchInput(e.target.value));
            this._on('cus_filter_checkall', 'change', (e) => this._filterCheckAll(e.target.checked));
            this._on('cus_filter_confirm', 'click', () => this._filterConfirm());
            this._on('cus_filter_reset', 'click', () => this._filterReset());

            // 点击筛选值整行也可勾选（点击 checkbox 本身由原生处理，这里处理点击文字/计数区域）
            this._on(this.$.filterList, 'click', (e) => {
                const item = e.target.closest('.filter_item');
                if (!item) return;
                // 点击 checkbox 本身不重复处理
                if (e.target.tagName === 'INPUT') return;
                const cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = !cb.checked;
            });

            // 筛选面板组内排序按钮
            this._on('cus_filter_sort_asc', 'click', () => this._onFilterSortClick('asc'));
            this._on('cus_filter_sort_desc', 'click', () => this._onFilterSortClick('desc'));
            this._on('cus_filter_sort_count', 'click', () => this._onFilterSortClick('count'));

            // 表类型
            this._bindRadioGroup('cus_radio_tableType', (val) => {
                self.report_type = val;
                self.elradio_tableType = val;
                if (val === 'detail') {
                    self.elradio_contentType = 'grid';
                    self.isShow_treelevel = false;
                    self._updateRadio('cus_radio_contentType', 'grid');
                }
                self._refreshAll();
            });

            // 表样式
            this._bindRadioGroup('cus_radio_contentType', (val) => {
                if (val === 'tree') {
                    self.elradio_tableType = 'summary';
                    self.report_type = 'summary';
                    self._updateRadio('cus_radio_tableType', 'summary');
                    self.isShow_treelevel = true;
                } else {
                    self.isShow_treelevel = false;
                }
                self.elradio_contentType = val;
                self.container.querySelector('#cus_treelevel_area').style.display = val === 'tree' ? 'inline' : 'none';
                self._refreshAll();
            });

            // 展开级数
            this._on('cus_ipt_treelevel', 'change', (e) => {
                self.expandTreelevel = parseInt(e.target.value) || 1;
                self._refreshAll();
            });

            // 列小计
            this._bindRadioGroup('cus_radio_colSubtotal', (val) => {
                self.elradio_isShow_ColSubtotal = val;
                self._refreshAll();
            });

            // 列总计
            this._bindRadioGroup('cus_radio_colAlltotal', (val) => {
                self.elradio_isShow_ColAlltotal = val;
                self._refreshAll();
            });

            // 行小计样式
            this._bindRadioGroup('cus_radio_rowSubtotal', (val) => {
                self.elradio_rowSubtotalStyle = val;
                self._refreshAll();
            });

            // 行小计合并列数
            this._on('cus_ipt_rowSubtotalCols', 'change', (e) => {
                self.ipt_rowSubtotal_numberColumns = parseInt(e.target.value) || 0;
                self._refreshAll();
            });

            // 数据聚合开关
            this._bindRadioGroup('cus_radio_merge', (val) => {
                self.enableMergeData = val;
                self._refreshAll();
            });


            // 字号
            this._bindRadioGroup('cus_radio_size', (val) => {
                self.size_style = val;
                self.elradio_size = val;
                self.$.wrapper.className = `cus_umytable_wrapper size_${val}`;
                self._refreshAll();
            });

            // 千分位
            this._bindRadioGroup('cus_radio_separator', (val) => {
                self.elradio_separator = val;
                self._refreshAll();
            });

            // 小数位
            this._on('cus_ipt_decimal', 'change', (e) => {
                self.ipt_decimalPlaces = parseInt(e.target.value) || 2;
                self._refreshAll();
            });

            // 冻结列
            this._bindRadioGroup('cus_radio_frozen', (val) => {
                self.elradio_autoFrozenCols = val;
                self.isShow_frozenCols = val === 'true';
                self.container.querySelector('#cus_frozen_count_area').style.display = 
                    val === 'true' ? 'inline' : 'none';
                self._refreshAll();
            });

            this._on('cus_ipt_frozenCols', 'change', (e) => {
                self.frozenCols = parseInt(e.target.value) || 1;
                self._refreshAll();
            });

            // 模板选择 - 同步显示文本
            this._on('cus_template_select', 'change', (e) => {
                self.sel_templateName = e.target.value;
                const lbl = self.container.querySelector('#cus_tpl_label_text');
                if (lbl) lbl.textContent = self.sel_templateName;
                self._applyTemplate();
            });

            // 条件属性
            this._on('cus_btn_props', 'click', () => self._showConditionEditor());

            // 保存偏好（用 prompt 输入名称）
            this._on('cus_btn_save_template', 'click', () => {
                const name = (prompt('请输入偏好名称：', '') || '').trim();
                if (!name) return;
                if (name === '系统默认') { alert('不能操作系统默认！'); return; }
                self._saveTemplate(name);
            });

            // 导出偏好
            this._on('cus_btn_export_template', 'click', () => self._exportTemplate());

            // 导入偏好
            this._on('cus_btn_import_template', 'click', () => {
                const inp = self.container.querySelector('#cus_ipt_import_file');
                if (inp) inp.click();
            });
            this._on('cus_ipt_import_file', 'change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        self._importTemplate(data);
                    } catch (err) {
                        alert('导入失败：文件格式不正确');
                    }
                    e.target.value = '';
                };
                reader.readAsText(file);
            });

            // 步进器 -/+
            this.container.querySelectorAll('.step_btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = btn.getAttribute('data-target');
                    const step = parseInt(btn.getAttribute('data-step')) || 0;
                    const input = self.container.querySelector('#' + target);
                    if (!input) return;
                    const min = parseInt(input.min) || 0;
                    const max = parseInt(input.max) || 99999;
                    let v = parseInt(input.value) || 0;
                    v = Math.max(min, Math.min(max, v + step));
                    input.value = v;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });

            // 点击外部关闭筛选面板
            document.addEventListener('click', (e) => {
                if (self.sel_divIsShow && !self.$.filterPanel.contains(e.target) 
                    && !e.target.classList.contains('col_filter_icon')
                    && !e.target.classList.contains('tag_filter')) {
                    self.sel_divIsShow = false;
                    self.$.filterPanel.classList.remove('show');
                }
            });

            // 窗口resize
            window.addEventListener('resize', this._debounce(() => {
                self._updateTableHeight();
            }, 300));
        }

        _on(id, event, handler) {
            const el = typeof id === 'string' ? this.container.querySelector('#' + id) : id;
            if (el) el.addEventListener(event, handler.bind(this));
        }

        _bindRadioGroup(groupId, callback) {
            const group = this.container.querySelector('#' + groupId);
            if (!group) return;
            group.addEventListener('click', (e) => {
                const label = e.target.closest('label');
                if (!label) return;
                const val = label.getAttribute('data-val');
                group.querySelectorAll('label').forEach(l => l.classList.remove('active'));
                label.classList.add('active');
                callback(val);
            });
        }

        _updateRadio(groupId, val) {
            const group = this.container.querySelector('#' + groupId);
            if (!group) return;
            group.querySelectorAll('label').forEach(l => {
                l.classList.toggle('active', l.getAttribute('data-val') === val);
            });
        }

        _debounce(fn, delay) {
            let timer;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        // ==================== 数据加载 ====================
        async loadData(url) {
            this._showLoading();
            const startTime = Date.now();
            this._loadStartTime = startTime;
            try {
                const response = await fetch(url);
                const json = await response.json();
                this.rawData = json;
                this.rsp_jsonData = json;
                this._initFromData();
                // 查询完成时间：与打印时间/导出时间同位置（备注区右侧）展示
                this._queryTime = this._formatDate(new Date());
                this._renderTitle();
                this._syncWindowObject(startTime);
            } catch (err) {
                console.error('CusUmyTable: 数据加载失败', err);
                alert('数据加载失败: ' + err.message);
                this._hideLoading();
            }
        }

        /**
         * 同步 window.cus_umytable 对象，结构与 App.vue 保持一致
         */
        _syncWindowObject(startTime) {
            if (!this.rsp_jsonData) return;
            const _this = this;

            if (window.cus_umytable == undefined) {
                window.cus_umytable = { report_descript: {} };
            }
            window.cus_umytable.report_descript = {
                "rpt_des_name": _this.rpt_des_name,
                "rpt_des_remark": _this.rpt_des_remark,
                "rpt_des_rowFields": _this.rows_fieldList.map(item => item.name).toString(),
                "rpt_des_colFields": _this.cols_fieldList.map(item => item.name).toString(),
                "rpt_des_numericFields": _this.numerics_fieldlist.map(item => item.name).toString(),
                "rpt_des_hideFields": _this.hide_fieldslist.map(item => item.name).toString(),
                "rpt_cfg_type": _this.report_type,
                "rpt_cfg_ShowColSubtotal": _this.elradio_isShow_ColSubtotal,
                "rpt_cfg_ShowColAlltotal": _this.elradio_isShow_ColAlltotal,
                "rpt_cfg_contentType": _this.elradio_contentType,
                "rpt_cfg_expandTreelevel": _this.expandTreelevel,
                "rpt_cfg_autoFrozenCols": _this.elradio_autoFrozenCols,
                "rpt_cfg_frozenCols": _this.frozenCols,
                "rpt_cfg_separator": _this.elradio_separator,
                "rpt_cfg_decimalPlaces": _this.ipt_decimalPlaces,
                "rpt_cfg_columnWidths": _this.columnWidths,
                "rpt_des_data": _this.rsp_datalist_initial[0],
                "rpt_cfg_rowSubtotal_style": _this.elradio_rowSubtotalStyle,
                "rpt_cfg_rowSubtotal_numberColumns": _this.ipt_rowSubtotal_numberColumns,
                "rpt_cfg_orderby_fields": _this.orderby_fields,
                "conditionFields_list": _this.conditionFields_list || [],
                "rpt_cfg_filterlist": _this.filter_fieldlist
            };
            window.cus_umytable.custom_templates = _this.custom_templates;
            window.cus_umytable.datalist = _this.rsp_jsonData.datalist;
            window.cus_umytable.filterlist = _this.filter_fieldlist;

            // dataset：树状=treeData / 网格(汇总)=grid_datas / 明细=datalist
            if (_this.elradio_contentType === 'tree') {
                window.cus_umytable.dataset = _this.ux_grid_treeData;
            } else if (_this.report_type === 'summary') {
                window.cus_umytable.dataset = _this.ux_grid_datas;
            } else {
                window.cus_umytable.dataset = _this.rsp_datalist_initial;
            }

            const endTime = Date.now();
            const s = startTime != null ? startTime : (_this._loadStartTime != null ? _this._loadStartTime : endTime);
            const elapsed = Math.max(0, endTime - s);
            window.cus_umytable.completed = `数据条数:${_this.rsp_datalist_initial.length}, 加载时长: ${elapsed.toFixed(2)} ms`;
        }


        _initFromData() {
            const json = this.rawData;
            this.reportinfo = json.report_descript || {};
            this.rpt_des_name = this.reportinfo.rpt_des_name || '';
            // 存储前缀用「原始报表名」固定，不受 UI 里 rpt_des_name 被覆盖（如条件属性/标题）的影响
            this._reportKey = encodeURIComponent((this.reportinfo.rpt_des_name || this.rpt_des_name || '报表') + '_cus_umytable');
            this.rpt_des_remark = this.reportinfo.rpt_des_remark || '';
            this.report_type = this.reportinfo.rpt_cfg_type || 'summary';
            this.elradio_tableType = this.report_type;
            this.elradio_contentType = this.reportinfo.rpt_cfg_contentType || 'grid';
            this.expandTreelevel = this.reportinfo.rpt_cfg_expandTreelevel || 1;
            this.elradio_autoFrozenCols = this._mapBoolean(this.reportinfo.rpt_cfg_autoFrozenCols, 'false');
            this.isShow_frozenCols = this.elradio_autoFrozenCols === 'true';
            this.frozenCols = this.reportinfo.rpt_cfg_frozenCols || 1;
            this.elradio_isShow_ColSubtotal = this._mapBoolean(this.reportinfo.rpt_cfg_ShowColSubtotal, 'false');
            this.elradio_isShow_ColAlltotal = this._mapBoolean(this.reportinfo.rpt_cfg_ShowColAlltotal, 'false');
            this.elradio_rowSubtotalStyle = this.reportinfo.rpt_cfg_rowSubtotal_style || 'simple';
            this.enableMergeData = this._mapBoolean(this.reportinfo.rpt_cfg_enableMergeData, 'true');
            this.ipt_rowSubtotal_numberColumns = parseInt(this.reportinfo.rpt_cfg_rowSubtotal_numberColumns) || 0;
            this.orderby_fields = this.reportinfo.rpt_cfg_orderby_fields || {};
            this.elradio_separator = this._mapBoolean(this.reportinfo.rpt_cfg_separator, 'false');
            this.ipt_decimalPlaces = parseInt(this.reportinfo.rpt_cfg_decimalPlaces) || 2;
            this.filter_fieldlist = this.reportinfo.rpt_cfg_filterlist || {};
            this.conditionFields_list = this.reportinfo.conditionFields_list || [];
            this.rsp_datalist_initial = json.datalist || [];

            // 恢复已保存的列宽
            this._loadSavedColumnWidths();

            // 初始化字段列表
            this._initFields();

            // 同步条件属性字段到待选项
            this._syncConditionFieldsToFields();

            // 更新UI
            this._syncUIFromConfig();
            this._updateTableHeight();
            this._renderTitle();

            // 加载模板
            this._loadTemplates();

            // 从数据文件加载预定义 custom_templates（结构与 App.vue 一致）
            this._loadPresetTemplates();

            // 恢复上次选中的偏好（刷新后自动应用）
            this._restoreSelectedTemplate();

            // 渲染
            this._refreshAll();
        }

        /**
         * 恢复上次选中的偏好（若存在且有效）
         */
        _restoreSelectedTemplate() {
            let saved;
            try {
                saved = decodeURIComponent(this.getCookie('sel_templateName') || '');
            } catch (e) { saved = ''; }
            if (!saved || saved === 'undefined' || saved === 'null') return;
            if (saved === '系统默认') return;
            const tpl = this.custom_templates.find(t => t.label === saved);
            if (tpl && tpl.grid_config) {
                this.sel_templateName = saved;
                this._applyTemplate();
            }
        }

        /**
         * 加载数据文件顶层 custom_templates（与 App.vue 逻辑一致）
         */
        _loadPresetTemplates() {
            if (!this.rsp_jsonData || this.rsp_jsonData.custom_templates == undefined) return;
            let temp_templates = this.rsp_jsonData.custom_templates;
            // App.vue 里会先尝试 JSON.parse（兼容字符串形式）
            if (typeof temp_templates === 'string') {
                try { temp_templates = JSON.parse(temp_templates); } catch (e) { /* ignore */ }
            }
            if (!Array.isArray(temp_templates)) return;
            temp_templates
                .filter(item => !this.custom_templates.map(ite => ite.label).includes(item.label))
                .forEach(tempcfg => {
                    tempcfg.cus_type = 'system';
                    this.custom_templates.push(tempcfg);
                });
            this._updateTemplateSelect();
        }

        _mapBoolean(val, defaultVal) {
            if (val === undefined || val === '') return defaultVal;
            if (val === true || val === 'true') return 'true';
            if (val === false || val === 'false') return 'false';
            return defaultVal;
        }

        _initFields() {
            const ri = this.reportinfo;
            let index = 0;

            // 隐藏字段
            if (ri.rpt_des_hideFields) {
                this.hide_fieldslist = ri.rpt_des_hideFields.split(',').map(name => ({
                    name: name.trim(), order: index++
                }));
            } else {
                this.hide_fieldslist = [];
            }

            // 数值字段
            const arr_numerics = (ri.rpt_des_numericFields || '').split(',');

            // 行字段
            if (ri.rpt_des_rowFields) {
                let arr_rows = ri.rpt_des_rowFields.split(',');
                if (this.report_type === 'summary') {
                    arr_rows = arr_rows.filter(v => !arr_numerics.includes(v.trim()));
                }
                this.rows_fieldList = arr_rows.map(name => ({
                    name: name.trim(), order: index++
                }));
            } else {
                this.rows_fieldList = [];
            }

            // 列字段
            if (ri.rpt_des_colFields) {
                this.cols_fieldList = ri.rpt_des_colFields.split(',').map(name => ({
                    name: name.trim(), order: index++
                }));
            } else {
                this.cols_fieldList = [];
            }

            // 数值字段
            if (ri.rpt_des_numericFields) {
                this.numerics_fieldlist = arr_numerics.map(name => ({
                    name: name.trim(), order: index++
                }));
            } else {
                this.numerics_fieldlist = [];
            }

            this.rowSubtotal_numberColumns_max = this.rows_fieldList.length;
            if (this.ipt_rowSubtotal_numberColumns === 0) {
                this.ipt_rowSubtotal_numberColumns = this.rows_fieldList.length;
            }
        }

        /**
         * 同步条件属性字段到字段列表（参考 App.vue handle_refreshConditionFields）
         * 条件属性定义的字段若未在任何字段区，自动加入「待选项」供拖拽使用
         */
        _syncConditionFieldsToFields() {
            // 1) 先处理改名：字段带 index 的，若 label 变了则同步更新各字段列表里的 name
            for (const cf of this.conditionFields_list || []) {
                if (!cf || !cf.label) continue;
                const lists = [this.rows_fieldList, this.cols_fieldList, this.numerics_fieldlist, this.hide_fieldslist];
                for (const list of lists) {
                    for (const f of list) {
                        if (f.index !== undefined && f.index === cf.index && f.name !== cf.label) {
                            f.name = cf.label;
                        }
                    }
                }
            }
            // 2) 清理已被删除的条件字段（带 index 但不在 conditionFields_list 中的）
            const activeIdx = new Set((this.conditionFields_list || []).map(cf => cf.index));
            for (const list of [this.rows_fieldList, this.cols_fieldList, this.numerics_fieldlist, this.hide_fieldslist]) {
                for (let i = list.length - 1; i >= 0; i--) {
                    const f = list[i];
                    if (f.index !== undefined && !activeIdx.has(f.index)) {
                        list.splice(i, 1);
                    }
                }
            }
            // 3) 新增的条件字段加入待选项
            for (const cf of this.conditionFields_list || []) {
                if (!cf || !cf.label) continue;
                const all = [...this.rows_fieldList, ...this.cols_fieldList, ...this.numerics_fieldlist, ...this.hide_fieldslist];
                const exists = all.some(f => f.name === cf.label || f.index === cf.index);
                if (!exists) {
                    this.hide_fieldslist.push({ name: cf.label, order: all.length, index: cf.index });
                }
            }
        }

        _syncUIFromConfig() {
            this._updateRadio('cus_radio_tableType', this.report_type);
            this._updateRadio('cus_radio_contentType', this.elradio_contentType);
            this._updateRadio('cus_radio_colSubtotal', this.elradio_isShow_ColSubtotal);
            this._updateRadio('cus_radio_colAlltotal', this.elradio_isShow_ColAlltotal);
            this._updateRadio('cus_radio_rowSubtotal', this.elradio_rowSubtotalStyle);
            this._updateRadio('cus_radio_merge', this.enableMergeData);
            this._updateRadio('cus_radio_size', this.size_style);
            this._updateRadio('cus_radio_separator', this.elradio_separator);
            this._updateRadio('cus_radio_frozen', this.elradio_autoFrozenCols);

            const treeArea = this.container.querySelector('#cus_treelevel_area');
            if (treeArea) treeArea.style.display = this.elradio_contentType === 'tree' ? 'inline' : 'none';
            const frozenArea = this.container.querySelector('#cus_frozen_count_area');
            if (frozenArea) frozenArea.style.display = this.elradio_autoFrozenCols === 'true' ? 'inline' : 'none';

            const treeLevel = this.container.querySelector('#cus_ipt_treelevel');
            if (treeLevel) treeLevel.value = this.expandTreelevel;
            const decimal = this.container.querySelector('#cus_ipt_decimal');
            if (decimal) decimal.value = this.ipt_decimalPlaces;
            const frozenCols = this.container.querySelector('#cus_ipt_frozenCols');
            if (frozenCols) frozenCols.value = this.frozenCols;
            const rowCols = this.container.querySelector('#cus_ipt_rowSubtotalCols');
            if (rowCols) rowCols.value = this.ipt_rowSubtotal_numberColumns;
            rowCols.max = this.rows_fieldList.length || 10;

            // 更新拖拽区
            this._renderDragZones();
        }

        _renderDragZones() {
            const self = this;
            const zoneIds = ['cus_drag_rows', 'cus_drag_cols', 'cus_drag_numerics', 'cus_drag_hide'];
            const zoneToListMap = {
                'cus_drag_rows': 'rows_fieldList',
                'cus_drag_cols': 'cols_fieldList',
                'cus_drag_numerics': 'numerics_fieldlist',
                'cus_drag_hide': 'hide_fieldslist'
            };

            const renderZone = (zoneId, list, cls) => {
                const zone = this.container.querySelector('#' + zoneId);
                if (!zone) return;
                zone.innerHTML = list.map((f, idx) =>
                    `<span class="drag_tag ${cls || ''}" data-name="${f.name}" data-zone="${zoneId}" data-index="${idx}" draggable="true">
                        <span class="tag_label">${f.name}</span>
                        ${cls !== 'hide_tag' ? `<span class="tag_filter" data-name="${f.name}" data-zone="${zoneId}" title="筛选">${this._icon('caret_down')}</span>` : ''}
                        ${cls !== 'hide_tag' ? `<span class="tag_close" data-name="${f.name}" data-zone="${zoneId}" title="移除">×</span>` : ''}
                    </span>`
                ).join('');
            };

            renderZone('cus_drag_rows', this.rows_fieldList);
            renderZone('cus_drag_cols', this.cols_fieldList);
            renderZone('cus_drag_numerics', this.numerics_fieldlist, 'numeric_tag');
            renderZone('cus_drag_hide', this.hide_fieldslist, 'hide_tag');

            // 绑定拖拽标签的关闭事件
            ['cus_drag_rows', 'cus_drag_cols', 'cus_drag_numerics'].forEach(zoneId => {
                const zone = this.container.querySelector('#' + zoneId);
                if (!zone) return;
                zone.querySelectorAll('.tag_close').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const name = btn.getAttribute('data-name');
                        this._moveFieldToHide(name, zoneId);
                    });
                });
                // 绑定筛选按钮事件
                zone.querySelectorAll('.tag_filter').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const name = btn.getAttribute('data-name');
                        this._showFilterPanel(name, e);
                    });
                });
            });

            // 绑定待选项双击添加到对应区域
            const hideZone = this.container.querySelector('#cus_drag_hide');
            if (hideZone) {
                hideZone.querySelectorAll('.drag_tag').forEach(tag => {
                    tag.addEventListener('dblclick', () => {
                        const name = tag.getAttribute('data-name');
                        this._moveFieldFromHide(name, 'cus_drag_rows');
                    });
                });
            }

            // ==================== 拖拽排序与跨区域移动 ====================
            // 拖拽状态
            let dragData = null; // { name, fromZone, fromIndex }
            let dragGhost = null;
            let dropIndicator = null;

            // 创建拖拽预览元素
            function createDragGhost(name, zoneId) {
                const ghost = document.createElement('div');
                ghost.className = 'drag_ghost_element';
                ghost.textContent = name;
                ghost.style.position = 'absolute';
                ghost.style.top = '-9999px';
                ghost.style.left = '-9999px';
                ghost.style.padding = '4px 12px';
                ghost.style.background = '#409eff';
                ghost.style.color = '#fff';
                ghost.style.borderRadius = '3px';
                ghost.style.fontSize = '12px';
                ghost.style.whiteSpace = 'nowrap';
                ghost.style.pointerEvents = 'none';
                ghost.style.zIndex = '9999';
                document.body.appendChild(ghost);
                return ghost;
            }

            // 创建放置指示线
            function getDropIndicator() {
                if (!dropIndicator) {
                    dropIndicator = document.createElement('div');
                    dropIndicator.className = 'drag_drop_indicator';
                    document.body.appendChild(dropIndicator);
                }
                return dropIndicator;
            }

            // 隐藏放置指示线
            function hideDropIndicator() {
                const ind = getDropIndicator();
                ind.style.display = 'none';
            }

            // 计算拖拽标签在区域内的插入位置索引
            function getInsertIndex(zone, clientX) {
                const tags = Array.from(zone.querySelectorAll('.drag_tag:not(.drag_dragging)'));
                if (tags.length === 0) return 0;
                for (let i = 0; i < tags.length; i++) {
                    const rect = tags[i].getBoundingClientRect();
                    const midX = rect.left + rect.width / 2;
                    if (clientX < midX) return i;
                }
                return tags.length;
            }

            // 显示放置指示线
            function showDropIndicatorAt(zone, index, clientX, clientY) {
                const ind = getDropIndicator();
                const tags = Array.from(zone.querySelectorAll('.drag_tag:not(.drag_dragging)'));
                let refRect;
                if (tags.length === 0) {
                    refRect = zone.getBoundingClientRect();
                    ind.style.left = refRect.left + 'px';
                    ind.style.top = (refRect.top - 1) + 'px';
                    ind.style.width = '2px';
                    ind.style.height = refRect.height + 'px';
                } else if (index >= tags.length) {
                    refRect = tags[tags.length - 1].getBoundingClientRect();
                    ind.style.left = (refRect.right + 2) + 'px';
                    ind.style.top = refRect.top + 'px';
                    ind.style.width = '2px';
                    ind.style.height = refRect.height + 'px';
                } else {
                    refRect = tags[index].getBoundingClientRect();
                    ind.style.left = (refRect.left - 2) + 'px';
                    ind.style.top = refRect.top + 'px';
                    ind.style.width = '2px';
                    ind.style.height = refRect.height + 'px';
                }
                ind.style.display = 'block';
                ind.style.position = 'fixed';
                ind.style.background = '#409eff';
                ind.style.zIndex = '10000';
                ind.style.pointerEvents = 'none';
            }

            // 为每个zone绑定拖拽事件
            // 注意：_renderDragZones 会在每次 _refreshAll 时被调用，若重复绑定同一 zone
            // 会导致 drop/dragover 监听器堆叠、一次拖拽触发多次 splice，造成"时灵时不灵"
            if (this._dragZonesBound) return;
            this._dragZonesBound = true;

            zoneIds.forEach(zoneId => {
                const zone = this.container.querySelector('#' + zoneId);
                if (!zone) return;

                // dragstart - 在标签上开始拖拽
                zone.addEventListener('dragstart', (e) => {
                    const tag = e.target.closest('.drag_tag');
                    if (!tag) return;
                    const name = tag.getAttribute('data-name');
                    const fromZone = tag.getAttribute('data-zone');
                    const fromIndex = parseInt(tag.getAttribute('data-index')) || 0;

                    dragData = { name, fromZone, fromIndex };

                    // 设置拖拽数据
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', name);

                    // 创建自定义拖拽预览
                    if (dragGhost && dragGhost.parentNode) dragGhost.parentNode.removeChild(dragGhost);
                    dragGhost = createDragGhost(name, zoneId);
                    e.dataTransfer.setDragImage(dragGhost, 0, 0);

                    // 延迟添加拖拽中样式
                    setTimeout(() => {
                        tag.classList.add('drag_dragging');
                        tag.style.opacity = '0.4';
                    }, 0);
                });

                // dragend - 拖拽结束
                zone.addEventListener('dragend', (e) => {
                    const tag = e.target.closest('.drag_tag');
                    if (tag) {
                        tag.classList.remove('drag_dragging');
                        tag.style.opacity = '';
                    }
                    // 清理
                    dragData = null;
                    if (dragGhost && dragGhost.parentNode) {
                        dragGhost.parentNode.removeChild(dragGhost);
                        dragGhost = null;
                    }
                    hideDropIndicator();
                    // 移除所有zone的高亮
                    zoneIds.forEach(zId => {
                        const z = self.container.querySelector('#' + zId);
                        if (z) z.classList.remove('drag_over');
                    });
                });

                // dragover - 拖拽经过区域
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';

                    if (!dragData) return;

                    zone.classList.add('drag_over');

                    // 显示放置指示线
                    const insertIdx = getInsertIndex(zone, e.clientX);
                    showDropIndicatorAt(zone, insertIdx, e.clientX, e.clientY);
                });

                // dragleave - 拖拽离开区域
                zone.addEventListener('dragleave', (e) => {
                    // 只在真正离开zone时才移除高亮
                    if (!zone.contains(e.relatedTarget)) {
                        zone.classList.remove('drag_over');
                        hideDropIndicator();
                    }
                });

                // drop - 放置到区域
                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!dragData) return;

                    const { name, fromZone, fromIndex } = dragData;
                    const toZone = zoneId;

                    // 清理UI状态
                    zone.classList.remove('drag_over');
                    hideDropIndicator();

                    if (fromZone === toZone) {
                        // 同区域内排序
                        // getInsertIndex 已排除拖拽中元素，返回的是移除拖拽项后的插入位置
                        const list = self[zoneToListMap[toZone]];
                        const insertIdx = getInsertIndex(zone, e.clientX);
                        if (fromIndex === insertIdx) {
                            // 位置没变，不操作
                            dragData = null;
                            return;
                        }
                        const [field] = list.splice(fromIndex, 1);
                        list.splice(insertIdx, 0, field);
                    } else {
                        // 跨区域移动
                        const fromList = self[zoneToListMap[fromZone]];
                        const toList = self[zoneToListMap[toZone]];
                        const idx = fromList.findIndex(f => f.name === name);
                        if (idx >= 0) {
                            const [field] = fromList.splice(idx, 1);
                            const insertIdx = getInsertIndex(zone, e.clientX);
                            toList.splice(insertIdx, 0, field);
                        }
                    }

                    dragData = null;
                    self._refreshAll();
                });
            });
        }

        _moveFieldToHide(name, fromZoneId) {
            let sourceList;
            switch(fromZoneId) {
                case 'cus_drag_rows': sourceList = this.rows_fieldList; break;
                case 'cus_drag_cols': sourceList = this.cols_fieldList; break;
                case 'cus_drag_numerics': sourceList = this.numerics_fieldlist; break;
                default: return;
            }
            const idx = sourceList.findIndex(f => f.name === name);
            if (idx >= 0) {
                const [field] = sourceList.splice(idx, 1);
                this.hide_fieldslist.push(field);
                this._refreshAll();
            }
        }

        _moveFieldFromHide(name, toZoneId) {
            const idx = this.hide_fieldslist.findIndex(f => f.name === name);
            if (idx >= 0) {
                const [field] = this.hide_fieldslist.splice(idx, 1);
                switch(toZoneId) {
                    case 'cus_drag_rows': this.rows_fieldList.push(field); break;
                    case 'cus_drag_cols': this.cols_fieldList.push(field); break;
                    case 'cus_drag_numerics': this.numerics_fieldlist.push(field); break;
                }
                this._refreshAll();
            }
        }

        // ==================== 核心计算 ====================
        _refreshAll() {
            this._showLoading();
            setTimeout(() => {
                try {
                    this.mergedDataMap.clear();
                    this.cells_merge = [];
                    this.ux_grid_columns = [];
                    this.ux_grid_header = [];
                    this.ux_grid_datas = [];
                    this.ux_grid_treeData = [];
                    this.expandTreeNodes = [];
                    this.ColumnValues = {};

                    if (this.report_type === 'summary') {
                        if (this.enableMergeData === 'true') {
                            this._mergeData();
                        } else {
                            // 关闭聚合：直接让建树消费原始明细（高基数字段场景，避免聚合开销放大）
                            this.rsp_datalist = this.rsp_datalist_initial;
                        }
                    }
                    this._buildColumns();
                    this._buildGridData();
                    this._renderTable();
                } catch (err) {
                    console.error('CusUmyTable: 渲染失败', err);
                }
                this._hideLoading();
                this._renderDragZones();
                this._syncWindowObject();
            }, 10);
        }

        _mergeData() {
            this.mergedDataMap.clear();
            const arr_fields = [...this.rows_fieldList.map(f => f.name), ...this.cols_fieldList.map(f => f.name)];
            const arr_numerics = this.numerics_fieldlist.map(f => f.name);

            // 分类条件字段：非聚合在行级判断，聚合在聚合后判断
            const { execute, executeAggregate } = this._classifyConditionFields();
            this._condExecuteAggregate = executeAggregate;

            for (let row of this.rsp_datalist_initial) {
                // 非聚合条件：先对原始行做行级判断（避免污染原始数据）
                let workRow = row;
                if (execute.length > 0) {
                    workRow = Object.assign({}, row);
                    for (const cf of execute) this._applyConditionField(workRow, cf, null);
                }
                const key = arr_fields.map(f => workRow[f] != null ? workRow[f] : '').join('-');
                if (!this.mergedDataMap.has(key)) {
                    const temp = {};
                    for (let f of arr_fields) temp[f] = workRow[f];
                    for (let n of arr_numerics) temp[n] = parseFloat(workRow[n]) || 0;
                    // 保留condition相关的样式字段
                    Object.keys(workRow).forEach(k => {
                        if (k.indexOf('_cell_style') > -1 || k.indexOf('_linkUrl') > -1 || k.indexOf('_linkTarget') > -1 || k.indexOf('_cond_newvalue') > -1) {
                            temp[k] = workRow[k];
                        }
                    });
                    this.mergedDataMap.set(key, temp);
                } else {
                    const existing = this.mergedDataMap.get(key);
                    for (let n of arr_numerics) {
                        if (!isNaN(workRow[n])) {
                            existing[n] = (existing[n] || 0) + parseFloat(workRow[n]);
                        }
                    }
                    this.mergedDataMap.set(key, existing);
                }
            }
            this.rsp_datalist = Array.from(this.mergedDataMap.values());

            // 聚合条件：在聚合后的每一行上求值（sum/count 作用在聚合结果上）
            if (executeAggregate.length > 0) {
                for (const row of this.rsp_datalist) {
                    for (const cf of executeAggregate) this._applyConditionField(row, cf, null);
                }
            }
        }

        _getFilteredData(datalist) {
            let result = datalist || this.rsp_datalist;
            Object.keys(this.filter_fieldlist).forEach(key => {
                const vals = this.filter_fieldlist[key];
                if (vals && vals.length > 0) {
                    result = result.filter(item => vals.includes(String(item[key])));
                }
            });
            return result;
        }

        // ==================== 条件属性（安全表达式求值，无 eval） ====================

        /**
         * 判断表达式是否含聚合函数 sum/count
         */
        _exprHasAggregate(str) {
            if (!str) return false;
            return /\b(sum|count)\s*\(/.test(String(str));
        }

        /**
         * 分类条件字段：返回 { execute(非聚合), executeAggregate(聚合) }
         */
        _classifyConditionFields() {
            const execute = [];
            const executeAggregate = [];
            const activeFields = [...this.rows_fieldList, ...this.cols_fieldList, ...this.numerics_fieldlist].map(f => f.name);
            for (const cf of this.conditionFields_list) {
                if (!cf || !cf.label) continue;
                let isAgg = false;
                for (const ei of (cf.expression_list || [])) {
                    if (ei.isAggregate === 'true' || ei.isAggregate === true) { isAgg = true; break; }
                    if (this._exprHasAggregate(ei.newValue)) { isAgg = true; break; }
                    for (const e of (ei.expression || [])) {
                        if (this._exprHasAggregate(e.key_exp) || this._exprHasAggregate(e.value_exp)) { isAgg = true; break; }
                    }
                    if (isAgg) break;
                }
                if (!activeFields.includes(cf.label)) continue;
                if (isAgg) executeAggregate.push(cf);
                else execute.push(cf);
            }
            return { execute, executeAggregate };
        }

        /**
         * 安全表达式求值器（替代 App.vue 的 eval）
         * 支持：数字、'字符串'、cell('字段')、sum('字段')、count('字段')、四则运算、括号、字符串拼接(+)
         */
        _evalExpr(str, rowItem, mapping) {
            const s = String(str == null ? '' : str).trim();
            if (s === '') return '';
            const self = this;
            let pos = 0;

            const isDigit = (c) => c >= '0' && c <= '9';
            const isIdent = (c) => /[a-zA-Z_\u4e00-\u9fa5]/.test(c);

            function skipWs() { while (pos < s.length && /\s/.test(s[pos])) pos++; }

            function parseString() {
                if (s[pos] !== "'") throw new Error('字符串字面量缺少引号');
                pos++;
                let out = '';
                while (pos < s.length && s[pos] !== "'") {
                    if (s[pos] === '\\') { pos++; if (pos < s.length) out += s[pos]; pos++; }
                    else { out += s[pos]; pos++; }
                }
                if (pos < s.length) pos++; // skip closing '
                return out;
            }

            function parseNumber() {
                const start = pos;
                while (pos < s.length && (isDigit(s[pos]) || s[pos] === '.')) pos++;
                return parseFloat(s.slice(start, pos));
            }

            function parseArgs() {
                const args = [];
                skipWs();
                if (s[pos] === ')') { pos++; return args; }
                while (pos < s.length) {
                    args.push(parseExpr());
                    skipWs();
                    if (s[pos] === ',') { pos++; skipWs(); continue; }
                    if (s[pos] === ')') { pos++; break; }
                    throw new Error('函数参数分隔错误');
                }
                return args;
            }

            function parseFunc() {
                const start = pos;
                while (pos < s.length && isIdent(s[pos])) pos++;
                const name = s.slice(start, pos);
                skipWs();
                if (s[pos] !== '(') throw new Error('函数缺少括号: ' + name);
                pos++;
                const args = parseArgs();
                return self._callCondFunc(name, args, rowItem, mapping);
            }

            function parseFactor() {
                skipWs();
                if (pos >= s.length) throw new Error('表达式意外结束');
                const c = s[pos];
                // 一元正负号
                if (c === '+' || c === '-') {
                    pos++;
                    const v = parseFactor();
                    return c === '-' ? -Number(v) : Number(v);
                }
                if (c === "'") return parseString();
                if (isDigit(c) || c === '.') return parseNumber();
                if (isIdent(c)) return parseFunc();
                if (c === '(') {
                    pos++;
                    const v = parseExpr();
                    skipWs();
                    if (s[pos] !== ')') throw new Error('括号不匹配');
                    pos++;
                    return v;
                }
                throw new Error('无法识别的字符: ' + c);
            }

            function parseTerm() {
                let left = parseFactor();
                skipWs();
                while (pos < s.length && (s[pos] === '*' || s[pos] === '/' || s[pos] === '%')) {
                    const op = s[pos]; pos++;
                    const right = parseFactor();
                    if (op === '*') left = Number(left) * Number(right);
                    else if (op === '/') left = Number(left) / Number(right);
                    else left = Number(left) % Number(right);
                    skipWs();
                }
                return left;
            }

            function parseExpr() {
                let left = parseTerm();
                skipWs();
                while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
                    const op = s[pos]; pos++;
                    const right = parseTerm();
                    if (op === '+') {
                        if (typeof left === 'string' || typeof right === 'string') left = String(left) + String(right);
                        else left = Number(left) + Number(right);
                    } else {
                        left = Number(left) - Number(right);
                    }
                    skipWs();
                }
                return left;
            }

            try {
                return parseExpr();
            } catch (e) {
                console.warn('CusUmyTable: 表达式求值失败', str, e.message);
                return '';
            }
        }

        /**
         * 条件表达式中取值：cell/sum/count 均取字段值，sum/count 转数值
         */
        _getCondCellValue(rowItem, mapping, fieldName, funcName) {
            let val;
            if (mapping && mapping[fieldName] !== undefined) {
                val = rowItem[mapping[fieldName]];
            } else {
                val = rowItem[fieldName];
            }
            if (val == null) val = '';
            if (funcName === 'sum' || funcName === 'count') {
                const n = Number(val);
                return isNaN(n) ? 0 : n;
            }
            return val;
        }

        /**
         * 条件表达式函数调用分发（cell/sum/count + 数学/字符串/日期函数）
         */
        _callCondFunc(name, args, rowItem, mapping) {
            const fn = String(name).toLowerCase();
            const a0 = args[0];
            const a1 = args[1];
            const a2 = args[2];
            switch (fn) {
                // 数据字段取值
                case 'cell': return this._getCondCellValue(rowItem, mapping, a0, 'cell');
                case 'sum': return this._getCondCellValue(rowItem, mapping, a0, 'sum');
                case 'count': return this._getCondCellValue(rowItem, mapping, a0, 'count');
                // 数学函数
                case 'abs': return Math.abs(Number(a0));
                case 'random': return Math.random();
                case 'ceil': return Math.ceil(Number(a0));
                case 'floor': return Math.floor(Number(a0));
                case 'round': return (Number(a0)).toFixed(a1 !== undefined ? parseInt(a1) : 0) * 1;
                case 'pow': return Math.pow(Number(a0), Number(a1));
                // 字符串函数
                case 'length': return String(a0).length;
                case 'indexof': return String(a0).indexOf(String(a1));
                case 'includes': return String(a0).includes(String(a1));
                case 'replace': return String(a0).replace(String(a1), String(a2));
                case 'substring': return String(a0).substring(Number(a1), a2 !== undefined ? Number(a2) : undefined);
                case 'trim': return String(a0).trim();
                case 'tolowercase': return String(a0).toLowerCase();
                case 'touppercase': return String(a0).toUpperCase();
                case 'param': return this._getUrlParam(String(a0));
                // 日期函数
                case 'getdate': return this._formatCondDate(new Date());
                case 'dateadd': return this._condDateAdd(String(a0), Number(a1), String(a2));
                case 'datediff': return this._condDateDiff(String(a0), String(a1), String(a2));
                case 'dateformat': return this._condDateFormat(String(a0), String(a1));
                case 'datename': return this._condDateName(String(a0), String(a1));
                default:
                    console.warn('CusUmyTable: 未知函数', name);
                    return '';
            }
        }

        _getUrlParam(name) {
            const m = new URLSearchParams(window.location.search).get(name);
            return m == null ? '' : m;
        }

        _formatCondDate(d) {
            const p = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
        }

        _condDateAdd(part, num, dateStr) {
            const d = new Date(String(dateStr).replace(/-/g, '/'));
            if (isNaN(d.getTime())) return '';
            const map = { 'yyyy': 'FullYear', 'yy': 'FullYear', 'year': 'FullYear', 'mm': 'Month', 'month': 'Month', 'dd': 'Date', 'day': 'Date', 'hh': 'Hours', 'hour': 'Hours', 'mi': 'Minutes', 'minute': 'Minutes', 'ss': 'Seconds', 'second': 'Seconds' };
            const key = map[String(part).toLowerCase()];
            if (!key) return this._formatCondDate(d);
            d['set' + key](d['get' + key]() + num);
            return this._formatCondDate(d);
        }

        _condDateDiff(part, d1, d2) {
            const a = new Date(String(d1).replace(/-/g, '/'));
            const b = new Date(String(d2).replace(/-/g, '/'));
            if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
            const ms = b - a;
            switch (String(part).toLowerCase()) {
                case 'ss': case 'second': return Math.round(ms / 1000);
                case 'mi': case 'minute': return Math.round(ms / 60000);
                case 'hh': case 'hour': return Math.round(ms / 3600000);
                case 'dd': case 'day': return Math.round(ms / 86400000);
                case 'mm': case 'month': return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
                case 'yyyy': case 'year': return b.getFullYear() - a.getFullYear();
                default: return Math.round(ms / 86400000);
            }
        }

        _condDateFormat(dateStr, fmt) {
            const d = new Date(String(dateStr).replace(/-/g, '/'));
            if (isNaN(d.getTime())) return '';
            const p = (n) => String(n).padStart(2, '0');
            return String(fmt)
                .replace(/yyyy/g, d.getFullYear())
                .replace(/MM/g, p(d.getMonth() + 1))
                .replace(/dd/g, p(d.getDate()))
                .replace(/HH/g, p(d.getHours()))
                .replace(/mm/g, p(d.getMinutes()))
                .replace(/ss/g, p(d.getSeconds()));
        }

        _condDateName(part, dateStr) {
            const d = new Date(String(dateStr).replace(/-/g, '/'));
            if (isNaN(d.getTime())) return '';
            switch (String(part).toLowerCase()) {
                case 'year': return String(d.getFullYear());
                case 'month': return String(d.getMonth() + 1);
                case 'day': return String(d.getDate());
                case 'week': return '星期' + '日一二三四五六'[d.getDay()];
                default: return '';
            }
        }

        /**
         * 比较运算
         */
        _compareCond(a, b, comparison) {
            switch (comparison) {
                case '<': return a < b;
                case '<=': return a <= b;
                case '>': return a > b;
                case '>=': return a >= b;
                case '==': return a == b;
                case '!=': return a != b;
                case 'indexOf': return String(a).indexOf(String(b)) > -1;
                default: return false;
            }
        }

        /**
         * 构建单元格样式
         */
        _buildCondCellStyle(expItem) {
            const st = {};
            if (expItem.background_color) st.backgroundColor = expItem.background_color;
            if (expItem.font_color) st.color = expItem.font_color;
            if (expItem.font_size) st.fontSize = expItem.font_size;
            return st;
        }

        /**
         * 应用条件效果（赋值/样式/链接）到行
         */
        _applyCondEffect(rowItem, fieldName, expItem, mapping) {
            if (String(expItem.newValue || '').trim() !== '') {
                rowItem[fieldName] = this._evalExpr(expItem.newValue, rowItem, mapping);
                // 标记条件属性产生的新值：渲染/导出时同样遵循千分位、小数保留位格式化
                rowItem[fieldName + '_cond_newvalue'] = true;
            }
            const style = this._buildCondCellStyle(expItem);
            if (Object.keys(style).length > 0) rowItem[fieldName + '_cell_style'] = style;
            if (String(expItem.linkUrl || '').trim() !== '') {
                rowItem[fieldName + '_linkUrl'] = this._evalExpr(expItem.linkUrl, rowItem, mapping);
            }
            if (String(expItem.linkTarget || '').trim() !== '') {
                rowItem[fieldName + '_linkTarget'] = expItem.linkTarget;
            }
        }

        /**
         * 对单行应用单个条件字段（if/else 分支）
         */
        _applyConditionField(rowItem, conditionField, mapping) {
            const fieldName = (mapping && mapping[conditionField.label] !== undefined) ? mapping[conditionField.label] : conditionField.label;
            for (const expItem of (conditionField.expression_list || [])) {
                if (expItem.condition_type === 'if') {
                    let isTrue = false;
                    const exprs = expItem.expression || [];
                    for (let i = 0; i < exprs.length; i++) {
                        const e = exprs[i];
                        if (String(e.comparison || '') === '') continue;
                        const keyExp = this._evalExpr(e.key_exp, rowItem, mapping);
                        const valExp = this._evalExpr(e.value_exp, rowItem, mapping);
                        const cmp = this._compareCond(keyExp, valExp, e.comparison);
                        if (i === 0) isTrue = cmp;
                        else if (e.previous_relation === 'or') isTrue = isTrue || cmp;
                        else isTrue = isTrue && cmp;
                    }
                    if (isTrue) {
                        this._applyCondEffect(rowItem, fieldName, expItem, mapping);
                        break;
                    }
                } else {
                    // else 分支，无条件执行
                    this._applyCondEffect(rowItem, fieldName, expItem, mapping);
                    break;
                }
            }
        }

        _buildColumns() {
            this.ux_grid_columns = [];
            this.arr_filter_vals = [];
            this.groupNumerics_fieldlist = [];
            this.groupNumerics_list = [];
            this.groupNumerics_map = new Map();

            // 行字段列
            const arr_rows = [];
            if (this.elradio_contentType === 'tree') {
                const keyname = this.rows_fieldList.map(f => f.name).join('/');
                arr_rows.push({ name: keyname, isTree: true });
            } else {
                for (let f of this.rows_fieldList) arr_rows.push(f);
            }

            if (this.report_type !== 'summary') {
                for (let f of this.numerics_fieldlist) {
                    if (!arr_rows.find(r => r.name === f.name)) arr_rows.push(f);
                }
            }

            const rowCols = [];
            for (let i = 0; i < arr_rows.length; i++) {
                const colname = arr_rows[i].name;
                const col = {
                    title: colname,
                    field: colname,
                    align: this.elradio_contentType === 'tree' && i === 0 ? 'left' : 'center',
                    level: 0,
                    isRowField: true,
                    colIndex: i,
                    frozen: this.elradio_autoFrozenCols === 'true' && i < this.frozenCols
                };
                if (this.elradio_contentType === 'tree' && i === 0) {
                    col.field = 'tree_nodeName';
                    col.isTree = true;
                }
                this.ux_grid_header.push(colname);
                this.arr_filter_vals.push(colname);
                rowCols.push(col);
            }

            // 列字段 + 数值列
            if (this.numerics_fieldlist.length > 0 && this.report_type === 'summary') {
                if (this.cols_fieldList.length > 0) {
                    const colColumns = this._buildColColumns(0, '');
                    rowCols.push(...colColumns);
                    // 列总计：追加"合计"列（对每个数值字段做全表求和，不区分列字段）
                    if (this.elradio_isShow_ColAlltotal === 'true') {
                        rowCols.push(...this._buildAlltotalColumns());
                    }
                } else {
                    const valCols = this._buildValueColumns('', '', 0);
                    rowCols.push(...valCols);
                }
            }

            this.ux_grid_columns = rowCols;
        }

        /**
         * 列总计（合计）列：对每个数值字段做全表求和。
         * 注意 field 直接用数值字段名（node[nf.name] 在 _buildTreeData 中已做跨列字段求和），
         * 不往 groupNumerics_list 里 push，避免与 node[nf.name] 重复累加。
         */
        _buildAlltotalColumns() {
            const children = [];
            for (let nf of this.numerics_fieldlist) {
                children.push({
                    title: nf.name,
                    field: nf.name,
                    align: 'center',
                    level: 1,
                    isNumeric: true,
                    minWidth: 100
                });
                this.ux_grid_header.push(nf.name);
                this.arr_filter_vals.push(nf.name);
            }
            return [{
                title: '合计',
                align: 'center',
                level: 0,
                children: children
            }];
        }

        _buildColColumns(index, colValue) {
            const colname = this.cols_fieldList[index].name;
            const filterVals = this.filter_fieldlist[colname] || [];
            let values;

            if (index === 0) {
                values = this._getColumnValues(colname);
            } else {
                const parts = colValue.split(',');
                let filtered = this.rsp_datalist;
                for (let i = 0; i < parts.length; i++) {
                    const key = this.cols_fieldList[i].name;
                    filtered = filtered.filter(item => String(item[key]) === parts[i]);
                }
                values = [...new Set(filtered.map(item => String(item[colname])))];
            }

            if (filterVals.length > 0) {
                values = values.filter(v => filterVals.includes(v));
            }

            // 排序
            const order = this.orderby_fields[colname];
            if (order === 'asc') values.sort((a, b) => String(a).localeCompare(String(b)));
            else if (order === 'desc') values.sort((a, b) => String(b).localeCompare(String(a)));
            else if (order === 'count') {
                // 计算每个值的出现次数（如果没有缓存则现场计算）
                const counts = this.filter_value_counts && Object.keys(this.filter_value_counts).length > 0
                    ? this.filter_value_counts
                    : this._computeValueCounts(colname);
                values.sort((a, b) => {
                    const diff = (counts[b] || 0) - (counts[a] || 0);
                    // 次数相同按值升序，保证明细 count 排序结果稳定可复现
                    return diff !== 0 ? diff : String(a).localeCompare(String(b));
                });
            }

            const columns = [];
            for (let val of values) {
                val = val == null ? '' : val;
                const titleInfo = colValue ? colValue + ',' + val : val;

                // 记录数值分组
                for (let nf of this.numerics_fieldlist) {
                    this.groupNumerics_fieldlist.push(titleInfo + ',' + nf.name);
                }

                let children;
                if (index + 1 < this.cols_fieldList.length) {
                    children = this._buildColColumns(index + 1, titleInfo);
                } else {
                    children = this._buildValueColumns(titleInfo.replace(/,/g, ''), titleInfo, index + 1);
                }

                const colObj = {
                    title: val,
                    align: 'center',
                    level: index,
                    children: children,
                };

                // 列小计
                if (this.elradio_isShow_ColSubtotal === 'true' && index + 1 < this.cols_fieldList.length && children.length > 1) {
                    colObj.children.push({
                        title: val + '小计',
                        align: 'center',
                        level: index + 1,
                        isSubtotal: true,
                        // 小计统计的是当前分组（titleInfo）下的数据，filters 须基于 titleInfo 而非父路径 colValue
                        children: this._buildValueColumns(titleInfo.replace(/,/g, ''), titleInfo, index + 2)
                    });
                }

                columns.push(colObj);
            }
            return columns;
        }

        _buildValueColumns(title, titleFullPath, level) {
            const children = [];
            for (let nf of this.numerics_fieldlist) {
                const colname = title + nf.name;
                const colname2 = titleFullPath ? titleFullPath.replace(/,/g, '') + nf.name : title + nf.name;
                children.push({
                    title: nf.name,
                    field: colname,
                    align: 'center',
                    level: level,
                    isNumeric: true,
                    minWidth: 100
                });
                this.ux_grid_header.push(nf.name);
                this.arr_filter_vals.push(colname);
                if (this.elradio_isShow_ColSubtotal === 'true' && titleFullPath && !this.groupNumerics_fieldlist.includes(colname2)) {
                    this.groupNumerics_fieldlist.push(colname2);
                }
            }

            // 更新groupNumerics_list
            for (let nf of this.numerics_fieldlist) {
                const cname = title + nf.name;
                const splitName = (titleFullPath ? titleFullPath + ',' : '') + nf.name;
                const parts = titleFullPath ? titleFullPath.split(',') : [];
                const filters = {};
                for (let i = 0; i < parts.length; i++) {
                    if (this.cols_fieldList[i]) {
                        filters[this.cols_fieldList[i].name] = parts[i];
                    }
                }
                this.groupNumerics_list.push({
                    cname: cname,
                    split_name: splitName,
                    total_field: nf.name,
                    filters: filters
                });
            }

            return children;
        }

        _getColumnValues(colname) {
            if (!this.ColumnValues[colname]) {
                this.ColumnValues[colname] = [...new Set(
                    this.rsp_datalist.map(item => String(item[colname] != null ? item[colname] : ''))
                )];
            }
            return this.ColumnValues[colname];
        }

        _computeValueCounts(colname) {
            const counts = {};
            for (let item of this.rsp_datalist) {
                const v = String(item[colname] != null ? item[colname] : '');
                counts[v] = (counts[v] || 0) + 1;
            }
            return counts;
        }

        _buildGridData() {
            const datalist = this._getFilteredData();
            const treeData = this._buildTreeData(datalist);

            // 行总计数据初始化
            this._rowAlltotalData = null;

            if (this.elradio_contentType === 'tree') {
                this.ux_grid_treeData = this._flattenTreeData(treeData, null);
            } else if (this.report_type === 'summary') {
                this.ux_grid_datas = [];
                this._flattenGridData(treeData, null);
                this._buildCellsMerge();
            } else {
                // 明细模式：应用字段排序（orderby_fields）
                this.ux_grid_datas = this._applyDetailSort(this._getFilteredData(this.rsp_datalist_initial));
            }

            // 传播条件样式到组合列名（条件字段作为数值字段时列名是组合名）
            this._propagateConditionStyles();

            // 所有模式都计算行总计
            this._computeRowAlltotal();
        }

        /**
         * 将条件字段（作为数值字段时）的样式/链接从原始字段名传播到所有组合列名。
         * 例：字段「测试字段」的样式 需要同步到「售票微信测试字段」「退票现金测试字段」等。
         */
        _propagateConditionStyles() {
            const condLabels = (this.conditionFields_list || []).map(cf => cf.label).filter(Boolean);
            if (condLabels.length === 0) return;
            const rows = this.elradio_contentType === 'tree' ? this.ux_grid_treeData : this.ux_grid_datas;
            if (!rows) return;

            const suffixAttrs = ['_cell_style', '_linkUrl', '_linkTarget', '_cond_newvalue'];
            for (const row of rows) {
                for (const label of condLabels) {
                    // 原始字段的样式
                    for (const suffix of suffixAttrs) {
                        const src = row[label + suffix];
                        if (src === undefined) continue;
                        // 找到所有以该字段名结尾的组合列，同步样式
                        for (const key of Object.keys(row)) {
                            if (key === label) continue;
                            if (key.endsWith(label + suffix)) continue;
                            // 组合列名 = 列字段值 + 字段名，如「售票微信测试字段」
                            if (key.endsWith(label)) {
                                row[key + suffix] = src;
                            }
                        }
                    }
                }
            }
        }

        /**
         * 明细模式排序：单字段排序（与汇总模式的逐层排序不同，明细无组内排序语义）。
         * 表头点击时已保证明细下 orderby_fields 只含一个字段（点新字段替换全部），
         * 这里取第一个排序字段应用，方向循环 asc → desc → count → 清除。
         * count 排序：按该字段各值的出现次数降序（次数相同再按值升序，保证稳定）。
         */
        _applyDetailSort(datalist) {
            const arr = [...datalist];
            // 过滤辅助标记（如 isNumberField），取第一个排序字段
            const keys = Object.keys(this.orderby_fields).filter(k => k !== 'isNumberField');
            if (keys.length === 0) return arr;
            const field = keys[0];
            const order = this.orderby_fields[field];
            if (order !== 'asc' && order !== 'desc' && order !== 'count') return arr;
            if (order === 'count') {
                return this._sortDetailByCount(arr, field);
            }
            const isNum = this.numerics_fieldlist.some(nf => nf.name === field);
            arr.sort((a, b) => {
                let av = a[field], bv = b[field];
                let cmp;
                if (isNum) {
                    av = parseFloat(av) || 0;
                    bv = parseFloat(bv) || 0;
                    cmp = av - bv;
                } else {
                    cmp = String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv));
                }
                return order === 'asc' ? cmp : -cmp;
            });
            return arr;
        }

        /**
         * 明细模式 count 排序：
         * 统计字段各值的出现次数，按【值聚合块】输出——出现次数多的值排在前面，
         * 块内保持数据原有相对顺序（无需依赖 sort 的稳定性）。
         */
        _sortDetailByCount(arr, field) {
            const counts = new Map();
            for (const row of arr) {
                const v = String(row[field] == null ? '' : row[field]);
                counts.set(v, (counts.get(v) || 0) + 1);
            }
            const orderIndex = new Map();
            const orderedKeys = Array.from(counts.keys()).sort((a, b) => {
                const diff = (counts.get(b) || 0) - (counts.get(a) || 0);
                return diff !== 0 ? diff : a.localeCompare(b);
            });
            orderedKeys.forEach((k, i) => orderIndex.set(k, i));
            return arr
                .map((row, i) => ({ row, i }))
                .sort((x, y) => {
                    const vx = String(x.row[field] == null ? '' : x.row[field]);
                    const vy = String(y.row[field] == null ? '' : y.row[field]);
                    const cx = orderIndex.get(vx), cy = orderIndex.get(vy);
                    return cx !== cy ? cx - cy : x.i - y.i;
                })
                .map(item => item.row);
        }

        /**
         * 计算行总计数据（对所有数值列求和）
         */
        _computeRowAlltotal() {
            const isTree = this.elradio_contentType === 'tree';
            const dataRows = isTree ? this.ux_grid_treeData : this.ux_grid_datas;
            if (!dataRows || dataRows.length === 0) {
                this._rowAlltotalData = null;
                return;
            }

            // 检查是否有数值字段
            if (!this.numerics_fieldlist || this.numerics_fieldlist.length === 0) {
                this._rowAlltotalData = null;
                return;
            }

            const totalRow = { type: 'grand_total' };

            // 行字段列：填充“行总计”标签
            for (let i = 0; i < this.rows_fieldList.length; i++) {
                const fn = this.rows_fieldList[i].name;
                if (i === 0) {
                    totalRow[fn] = '行总计';
                } else {
                    totalRow[fn] = '';
                }
            }

            // 数值列：累加求和
            for (let field of this.arr_filter_vals) {
                const isNumericField = this.numerics_fieldlist.some(nf => field.includes(nf.name));
                if (isNumericField) {
                    let sum = 0;
                    let hasValue = false;
                    for (let row of dataRows) {
                        // 跳过小计行
                        if (row.type === 'total') continue;
                        // 树模式下只累加根级节点（level=0），避免重复计算
                        if (isTree && row.level > 0) continue;
                        const val = row[field];
                        if (val != null && !isNaN(val)) {
                            sum += Number(val);
                            hasValue = true;
                        }
                    }
                    totalRow[field] = hasValue ? sum : null;
                } else {
                    // 非数值列，且不在行字段中的列（如条件字段）留空
                    if (!this.rows_fieldList.some(rf => rf.name === field)) {
                        totalRow[field] = '';
                    }
                }
            }

            this._rowAlltotalData = totalRow;
        }

        /**
         * 基于ux_grid_datas中连续相同值，重新计算cells_merge
         * 采用层级扫描：对每个行字段列，从左到右，合并所有父列值相同的连续行
         */
        _buildCellsMerge() {
            this.cells_merge = [];
            const rowFieldCount = this.rows_fieldList.length;
            const data = this.ux_grid_datas;

            if (!data || data.length === 0 || rowFieldCount === 0) return;

            // 合并列数限制：按「合并至几列」配置（ipt_rowSubtotal_numberColumns）
            // 与 App.vue 一致：col_len = ipt_rowSubtotal_numberColumns
            const mergeColLimit = (this.ipt_rowSubtotal_numberColumns > 0)
                ? Math.min(this.ipt_rowSubtotal_numberColumns, rowFieldCount)
                : rowFieldCount;

            for (let col = 0; col < mergeColLimit; col++) {
                const fieldName = this.rows_fieldList[col].name;
                let i = 0;
                while (i < data.length) {
                    // 找到从i开始、所有0~col列值都相同的连续行
                    let j = i + 1;
                    while (j < data.length) {
                        let allMatch = true;
                        for (let c = 0; c <= col; c++) {
                            const fn = this.rows_fieldList[c].name;
                            if (String(data[i][fn] || '') !== String(data[j][fn] || '')) {
                                allMatch = false;
                                break;
                            }
                        }
                        if (!allMatch) break;
                        j++;
                    }

                    // 连续 j-i 行在0~col列值都相同，对第col列进行合并
                    if (j - i > 1) {
                        this.cells_merge.push({
                            row: i,
                            col: col,
                            rowspan: j - i,
                            colspan: 1,
                            keyname: String(data[i][fieldName] || '')
                        });
                    }

                    i = j;
                }
            }
        }

        _buildTreeData(datalist) {
            const arr_fields = this.rows_fieldList.map(f => f.name);
            const treeMap = new Map();

            for (let obj of datalist) {
                let parentMap = treeMap;
                let pathMaps = [treeMap];

                for (let i = 0; i < arr_fields.length; i++) {
                    const fieldName = arr_fields[i];
                    const key = String(obj[fieldName] != null ? obj[fieldName] : '').replace(/['"\n\t\r]/g, '');
                    const isLast = i === arr_fields.length - 1;

                    if (!parentMap.has(key)) {
                        const node = {
                            key: key,
                            fieldName: fieldName,
                            fieldValue: key,
                            level: i,
                            children: new Map(),
                            datalist: [obj],
                            maxNodeCount: 1,
                            childField: arr_fields[i + 1] || null,
                        };
                        node['tree_nodeName'] = key;
                        for (let j = 0; j <= i; j++) {
                            node[arr_fields[j]] = obj[arr_fields[j]];
                        }
                        // 数值求和
                        for (let nf of this.numerics_fieldlist) {
                            node[nf.name] = parseFloat(obj[nf.name]) || 0;
                        }
                        // 拷贝条件样式/链接字段（避免在树重建时丢失）
                        Object.keys(obj).forEach(k => {
                            if (k.indexOf('_cell_style') > -1 || k.indexOf('_linkUrl') > -1 || k.indexOf('_linkTarget') > -1 || k.indexOf('_cond_newvalue') > -1) {
                                node[k] = obj[k];
                            }
                        });
                        // 填充列-数值组合字段（仅叶子层：中间层组合列值由建树后自底向上累加得出）
                        if (isLast) {
                            for (let gl of this.groupNumerics_list) {
                                const cname = gl.cname;
                                const filters = gl.filters;
                                let isok = true;
                                for (let fk of Object.keys(filters)) {
                                    if (String(obj[fk]) !== String(filters[fk])) {
                                        isok = false;
                                        break;
                                    }
                                }
                                node[cname] = isok ? (parseFloat(obj[gl.total_field]) || 0) : 0;
                            }
                        }
                        parentMap.set(key, node);
                    } else {
                        const node = parentMap.get(key);
                        node.datalist.push(obj);
                        for (let nf of this.numerics_fieldlist) {
                            node[nf.name] = (node[nf.name] || 0) + (parseFloat(obj[nf.name]) || 0);
                        }
                        // 填充列-数值组合字段（仅叶子层）
                        if (isLast) {
                            for (let gl of this.groupNumerics_list) {
                                const cname = gl.cname;
                                const filters = gl.filters;
                                let isok = true;
                                for (let fk of Object.keys(filters)) {
                                    if (String(obj[fk]) !== String(filters[fk])) {
                                        isok = false;
                                        break;
                                    }
                                }
                                node[cname] = (node[cname] || 0) + (isok ? (parseFloat(obj[gl.total_field]) || 0) : 0);
                            }
                        }
                    }

                    if (!isLast) {
                        parentMap = parentMap.get(key).children;
                    }
                }
            }

            // 自底向上累加：把叶子层的组合列值汇总到各中间层节点（替代对每层重复跑 filter 匹配）
            if (this.groupNumerics_list.length > 0) {
                const comboFields = this.groupNumerics_list.map(gl => gl.cname);
                treeMap.forEach((node) => this._accumulateComboToAncestors(node, comboFields));
            }
            return treeMap;
        }

        /**
         * 自底向上累加组合列值到中间层节点。
         * 叶子层在 _buildTreeData 中已按 filter 匹配填好组合列值；
         * 这里递归地对每个中间层节点，将子节点的组合列值求和写回，避免对每个中间层重复跑 filter 匹配。
         */
        _accumulateComboToAncestors(node, comboFields) {
            if (!node) return;
            if (node.children && node.children.size > 0) {
                // 先递归处理子层（自底向上）
                node.children.forEach((child) => this._accumulateComboToAncestors(child, comboFields));
                // 子层已汇总完毕，将子节点组合列值累加到当前中间层节点
                node.children.forEach((child) => {
                    for (const cname of comboFields) {
                        node[cname] = (node[cname] || 0) + (parseFloat(child[cname]) || 0);
                    }
                });
            }
        }

        _flattenTreeData(mapData, parentNode, parentPath) {
            const nodeLevel = parentNode ? parentNode.level + 1 : 0;
            const fieldName = this.rows_fieldList[nodeLevel] ? this.rows_fieldList[nodeLevel].name : '';

            // 排序
            let sortedMap = mapData;
            const order = this.orderby_fields[fieldName];
            if (order) {
                const isNumField = this.numerics_fieldlist.find(f => Object.keys(this.orderby_fields).includes(f.name));
                const arr = Array.from(mapData);
                arr.sort((a, b) => {
                    if (order === 'count') {
                        return (b[1].datalist ? b[1].datalist.length : 0) - (a[1].datalist ? a[1].datalist.length : 0);
                    }
                    if (isNumField) {
                        const fn = isNumField.name;
                        return order === 'asc' ? (a[1][fn] || 0) - (b[1][fn] || 0) : (b[1][fn] || 0) - (a[1][fn] || 0);
                    }
                    return order === 'asc'
                        ? String(a[0]).localeCompare(String(b[0]))
                        : String(b[0]).localeCompare(String(a[0]));
                });
                sortedMap = new Map(arr);
            }

            const result = [];
            sortedMap.forEach((item) => {
                const temp = { ...item };
                // 生成唯一 key（含完整路径），避免不同层级/不同父节点下字段值重复导致展开状态冲突
                const nodePath = parentPath ? `${parentPath}>${temp.key}` : temp.key;
                temp.key = nodePath;
                delete temp.children;
                if (item.children.size > 0) {
                    temp.children = this._flattenTreeData(item.children, item, nodePath);
                }
                if (temp.level + 1 < this.expandTreelevel) {
                    this.expandTreeNodes.push(temp);
                }
                result.push(temp);
            });
            return result;
        }

        _flattenGridData(mapData, parentNode) {
            const maxLevel = this.rows_fieldList.length - 1;
            const nodeLevel = parentNode ? parentNode.level + 1 : 0;
            const fieldName = this.rows_fieldList[nodeLevel] ? this.rows_fieldList[nodeLevel].name : '';

            // 排序
            let sortedMap = mapData;
            const order = this.orderby_fields[fieldName];
            if (order) {
                const isNumField = this.numerics_fieldlist.find(f => Object.keys(this.orderby_fields).includes(f.name));
                const arr = Array.from(mapData);
                arr.sort((a, b) => {
                    if (order === 'count') {
                        return (b[1].datalist ? b[1].datalist.length : 0) - (a[1].datalist ? a[1].datalist.length : 0);
                    }
                    if (isNumField) {
                        const fn = isNumField.name;
                        return order === 'asc' ? (a[1][fn] || 0) - (b[1][fn] || 0) : (b[1][fn] || 0) - (a[1][fn] || 0);
                    }
                    return order === 'asc'
                        ? String(a[0]).localeCompare(String(b[0]))
                        : String(b[0]).localeCompare(String(a[0]));
                });
                sortedMap = new Map(arr);
            }

            sortedMap.forEach((item) => {
                const temp = { ...item };
                delete temp.children;
                if (item.children.size > 0) {
                    temp.children = this._flattenGridData(item.children, item);
                }
                if (maxLevel === temp.level && temp.level > 0) {
                    parentNode.maxNodeCount = (parentNode.maxNodeCount || 0) + 1;
                } else if (parentNode) {
                    parentNode.maxNodeCount = (parentNode.maxNodeCount || 0) + (item.maxNodeCount || 0);
                }

                // 行小计处理
                const childrenObj = item.children;
                const childrenSize = childrenObj ? (childrenObj.size || 0) : 0;
                const styleVal = this.elradio_rowSubtotalStyle === 'simple' ? 1 : 0;
                if (temp.level < this.ipt_rowSubtotal_numberColumns && childrenObj && childrenSize > 0) {
                    if (this.elradio_rowSubtotalStyle !== 'none') {
                        if (childrenSize > styleVal || (item.maxNodeCount > 1 && temp.level === this.ipt_rowSubtotal_numberColumns - 1)) {
                            const subtotalRow = { ...temp };
                            const nextFieldName = this.rows_fieldList[temp.level + 1] ? this.rows_fieldList[temp.level + 1].name : '';
                            subtotalRow[nextFieldName] = temp.key + '小计';
                            subtotalRow.type = 'total';
                            if (temp.level > 0 && parentNode) {
                                parentNode.maxNodeCount = (parentNode.maxNodeCount || 0) + 1;
                            }
                            this.ux_grid_datas.push(subtotalRow);
                        }
                    }
                } else if (!childrenObj || childrenSize === 0) {
                    this.ux_grid_datas.push(temp);
                }
            });
        }

        // ==================== 表格渲染 ====================
        _syncStickyHeaderOffset() {
            try {
                const tbl = this.container.querySelector('.cus_umytable_table');
                const wpr = this.container.querySelector('.cus_umytable_wrapper');
                if (!tbl || !wpr) { console.log('[sync] no tbl/wpr'); return; }
                const rows = tbl.querySelectorAll('thead tr');
                let cumH = 0;
                const v = ['--cus-r1h', '--cus-r1r2h', '--cus-r1r2r3h', '--cus-r1r2r3r4h'];
                rows.forEach((r, i) => {
                    const h = r.offsetHeight || 32;
                    if (i < v.length) { cumH += h; wpr.style.setProperty(v[i], cumH + 'px'); }
                });
                document.title = 'rows=' + rows.length + ' v1=' + wpr.style.getPropertyValue('--cus-r1h') + ' v2=' + wpr.style.getPropertyValue('--cus-r1r2h');
            } catch (e) { console.error('[sync] error', e); }
        }

        _renderTable() {
            const thead = this.$.thead;
            const tbody = this.$.tbody;
            const tfoot = this.$.tfoot;
            thead.innerHTML = '';
            tfoot.innerHTML = '';
            // 清空tbody后重新添加占位行（innerHTML=''会销毁占位行引用）
            tbody.innerHTML = '';
            this._rebuildSpacers(tbody);

            if (this.elradio_contentType === 'tree') {
                this._renderTreeTable(thead, tbody);
            } else {
                this._renderGridTable(thead, tbody);
            }

            // 渲染行总计到 tfoot
            this._renderRowAlltotal(tfoot);

            // 绑定表头点击事件（筛选/排序）
            this._bindTableHeaderEvents();

            // 同步 thead 第一行高度到 CSS 变量（用于多行表头 sticky 偏移）
            this._syncStickyHeaderOffset();

            // 列宽控制
            this._computeThColMapping();
            this._addColgroup();
            this._applyColumnWidths();
            this._initColumnResize();
            // 有自定义列宽时添加fixed样式类
            if (Object.keys(this.columnWidths).length > 0) {
                this.$.table.classList.add('table-fixed-layout');
            } else {
                this.$.table.classList.remove('table-fixed-layout');
            }

            // 首次渲染：同步固化列宽（强制 reflow 后捕获 auto 宽度），
            // 在虚拟滚动初始化之前完成，避免滚动时 auto 布局随可见行内容重算导致表头列宽跳变
            this._fixColumnWidthsOnce();
            // 固化后若产生了列宽，立即切 fixed 布局 + colgroup，确保后续滚动列宽恒定
            if (Object.keys(this.columnWidths).length > 0) {
                this._addColgroup();
                this._applyColumnWidths();
                this.$.table.classList.add('table-fixed-layout');
            }

            // 初始化虚拟滚动
            this._initVirtualScroll();
        }

        /**
         * 渲染行总计到 tfoot（固定表尾）
         */
        _renderRowAlltotal(tfoot) {
            if (!this._rowAlltotalData) return;

            const totalRow = this._rowAlltotalData;
            const tr = document.createElement('tr');
            tr.classList.add('grand_total_row');

            for (let j = 0; j < this.arr_filter_vals.length; j++) {
                const fieldName = this.arr_filter_vals[j];
                const td = document.createElement('td');

                let val = totalRow[fieldName];

                // 格式化数值
                const isNumericField = this._isNumericCell(totalRow, fieldName);
                if (isNumericField && val != null && !isNaN(val)) {
                    val = this.format_number(val);
                    if (val === 0 || val === '0') val = '-';
                }
                if (val == null) val = '';

                td.textContent = val;
                td.setAttribute('data-field', fieldName);

                // 第一个行字段列左对齐（与表体一致）
                if (j === 0) {
                    td.style.textAlign = 'left';
                }

                // 冻结列
                if (this.elradio_autoFrozenCols === 'true' && j < this.frozenCols) {
                    td.classList.add('frozen_col');
                }

                tr.appendChild(td);
            }

            tfoot.appendChild(tr);
        }

        /**
         * 重建占位行并更新DOM引用
         */
        _rebuildSpacers(tbody) {
            const spacerTop = document.createElement('tr');
            spacerTop.className = 'virtual_spacer_top';
            spacerTop.id = 'cus_virtual_spacer_top';
            spacerTop.innerHTML = '<td></td>';

            const spacerBottom = document.createElement('tr');
            spacerBottom.className = 'virtual_spacer_bottom';
            spacerBottom.id = 'cus_virtual_spacer_bottom';
            spacerBottom.innerHTML = '<td></td>';

            tbody.appendChild(spacerTop);
            tbody.appendChild(spacerBottom);

            // 更新DOM引用
            this.$.spacerTop = spacerTop;
            this.$.spacerBottom = spacerBottom;
        }

        // ==================== 虚拟滚动 ====================

        /**
         * 初始化虚拟滚动
         * 首次全量渲染后测量实际行高，然后切换到虚拟模式
         */
        _initVirtualScroll() {
            const dataRows = this._getVirtualDataRows();
            const totalRows = dataRows ? dataRows.length : 0;

            // 数据量较少时不启用虚拟滚动
            if (totalRows <= 50) {
                this._virtualEnabled = false;
                this._resetSpacers();
                this.$.tableWrapper.classList.remove('virtual-scroll-enabled');
                return;
            }

            this._virtualEnabled = true;
            this.$.tableWrapper.classList.add('virtual-scroll-enabled');

            // 测量实际行高
            this._measureRowHeight();

            // 初始渲染可见行
            this._doVirtualRender();

            // 绑定滚动事件（仅绑定一次）
            if (!this._virtualScrollBound) {
                this._virtualScrollBound = true;
                const wrapper = this.$.tableWrapper;
                wrapper.addEventListener('scroll', () => {
                    if (this._virtualScrollRAF) return;
                    this._virtualScrollRAF = requestAnimationFrame(() => {
                        this._onVirtualScroll();
                        this._virtualScrollRAF = null;
                    });
                });
            }
        }

        /**
         * 获取当前模式的数据行
         */
        _getVirtualDataRows() {
            if (this.elradio_contentType === 'tree') {
                return this._flatTreeNodes;
            }
            return this.ux_grid_datas;
        }

        /**
         * 测量实际行高
         */
        _measureRowHeight() {
            const tbody = this.$.tbody;
            const firstRow = tbody.querySelector('tr:not(.virtual_spacer_top):not(.virtual_spacer_bottom)');
            if (firstRow) {
                const rect = firstRow.getBoundingClientRect();
                if (rect.height > 0) {
                    this._rowHeight = rect.height;
                }
            }
        }

        /**
         * 虚拟滚动事件处理
         */
        _onVirtualScroll() {
            if (!this._virtualEnabled) return;
            const wrapper = this.$.tableWrapper;
            const scrollTop = wrapper.scrollTop;

            // 滚动距离过小不触发重渲染
            if (Math.abs(scrollTop - this._lastScrollTop) < this._rowHeight * 0.5) return;
            this._lastScrollTop = scrollTop;

            this._doVirtualRender();
        }

        /**
         * 计算可见行范围
         */
        _calculateVisibleRange(totalRows) {
            const wrapper = this.$.tableWrapper;
            const scrollTop = wrapper.scrollTop;
            const viewportHeight = wrapper.clientHeight;
            const rowHeight = this._rowHeight;
            const buffer = this._bufferCount;

            // 计算表头高度偏移
            const theadHeight = this.$.thead ? this.$.thead.offsetHeight : 0;
            const effectiveScrollTop = Math.max(0, scrollTop - theadHeight);

            let startIdx = Math.floor(effectiveScrollTop / rowHeight) - buffer;
            let endIdx = Math.ceil((effectiveScrollTop + viewportHeight) / rowHeight) + buffer;

            startIdx = Math.max(0, startIdx);
            endIdx = Math.min(totalRows, endIdx);

            return { startIdx, endIdx };
        }

        /**
         * 执行虚拟渲染
         */
        _doVirtualRender() {
            const dataRows = this._getVirtualDataRows();
            if (!dataRows || dataRows.length === 0) return;

            const totalRows = dataRows.length;
            const { startIdx, endIdx } = this._calculateVisibleRange(totalRows);

            // 避免不必要的重渲染
            if (startIdx === this._virtualStartIdx && endIdx === this._virtualEndIdx) return;
            this._virtualStartIdx = startIdx;
            this._virtualEndIdx = endIdx;

            // 处理合并单元格：扩展起始行以包含跨入可见区域的合并单元格
            const adjustedStart = this._adjustStartForMerges(startIdx, endIdx);

            // 重新渲染可见行
            this._renderVisibleRows(adjustedStart, endIdx);

            // 更新占位行高度
            this._updateVirtualSpacers(adjustedStart, endIdx, totalRows);

            // 防御：校准表头列宽。若重渲染导致表头宽度与固化的 columnWidths 漂移，立即强制恢复
            this._verifyHeaderWidths();
        }

        /**
         * 校准表头列宽：检测叶子 th 实际宽度与固化的 columnWidths 是否有偏差，
         * 有漂移则强制重建 colgroup 并重新应用列宽，保证滚动时表头列宽恒定
         */
        _verifyHeaderWidths() {
            if (Object.keys(this.columnWidths).length === 0) return;
            const thead = this.$.thead;
            if (!thead) return;
            const rows = thead.querySelectorAll('tr');
            const lastRow = rows[rows.length - 1];
            if (!lastRow) return;

            let drifted = false;
            const ths = lastRow.querySelectorAll('th');
            for (let th of ths) {
                const start = parseInt(th.getAttribute('data-leaf-col-start'));
                const end = parseInt(th.getAttribute('data-leaf-col-end'));
                if (isNaN(start) || isNaN(end) || start !== end) continue;
                const fieldName = this.arr_filter_vals[start];
                const expected = this.columnWidths[fieldName];
                if (!expected) continue;
                const actual = th.getBoundingClientRect().width;
                if (Math.abs(actual - expected) > 1) { drifted = true; break; }
            }
            if (drifted) {
                this._addColgroup();
                this._applyColumnWidths();
            }
        }

        /**
         * 调整起始行索引以处理合并单元格
         * 如果一个合并单元格从startIdx上方开始但延伸到可见区域内，需要包含其起始行
         */
        _adjustStartForMerges(startIdx, endIdx) {
            if (this.elradio_contentType === 'tree') return startIdx;

            let adjustedStart = startIdx;
            for (let merge of this.cells_merge) {
                const mergeEnd = merge.row + merge.rowspan - 1;
                // 合并单元格从可见区域上方开始，但延伸到可见区域内
                if (merge.row < startIdx && mergeEnd >= startIdx && merge.rowspan > 1) {
                    adjustedStart = Math.min(adjustedStart, merge.row);
                }
            }
            return adjustedStart;
        }

        /**
         * 渲染可见行（从startIdx到endIdx）
         */
        _renderVisibleRows(startIdx, endIdx) {
            const tbody = this.$.tbody;
            const spacerTop = this.$.spacerTop;
            const spacerBottom = this.$.spacerBottom;

            // 移除旧的数据行（保留占位行）
            const rowsToRemove = tbody.querySelectorAll('tr:not(.virtual_spacer_top):not(.virtual_spacer_bottom)');
            rowsToRemove.forEach(tr => tr.remove());

            if (this.elradio_contentType === 'tree') {
                this._renderTreeVisibleRows(tbody, spacerBottom, startIdx, endIdx);
            } else {
                this._renderGridVisibleRows(tbody, spacerBottom, startIdx, endIdx);
            }
        }

        /**
         * 渲染Grid模式可见行
         */
        _renderGridVisibleRows(tbody, spacerBottom, startIdx, endIdx) {
            const dataRows = this.ux_grid_datas;
            if (!dataRows || dataRows.length === 0) return;

            // 构建单元格合并查找映射
            const mergeMap = new Map();
            const coveredCells = new Set();
            for (let merge of this.cells_merge) {
                const key = `${merge.row},${merge.col}`;
                mergeMap.set(key, merge);
                for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
                    for (let c = merge.col; c < merge.col + merge.colspan; c++) {
                        if (r !== merge.row || c !== merge.col) {
                            coveredCells.add(`${r},${c}`);
                        }
                    }
                }
            }

            // 使用文档片段批量插入
            const fragment = document.createDocumentFragment();

            for (let i = startIdx; i < endIdx; i++) {
                const row = dataRows[i];
                const tr = document.createElement('tr');

                if (row.type === 'total') {
                    tr.classList.add('subtotal_row');
                }
                // 虚拟滚动时，基于数据行索引添加奇偶行样式
                if (i % 2 === 1) {
                    tr.classList.add('virtual_row_even');
                }

                for (let j = 0; j < this.arr_filter_vals.length; j++) {
                    // 跳过被合并覆盖的单元格
                    if (coveredCells.has(`${i},${j}`)) continue;

                    const td = document.createElement('td');

                    // 应用合并属性（虚拟滚动用）
                    const merge = mergeMap.get(`${i},${j}`);
                    if (merge) {
                        if (merge.rowspan > 1) {
                            // 如果合并单元格的起始行在可见区域上方，截断rowspan
                            const visibleRowspan = Math.min(merge.rowspan, merge.row + merge.rowspan - startIdx);
                            td.rowSpan = visibleRowspan;
                        }
                        if (merge.colspan > 1) td.colSpan = merge.colspan;
                    }

                    const fieldName = this.arr_filter_vals[j];
                    let val = row[fieldName];

                    // 格式化数值
                    const isNumericField = this._isNumericCell(row, fieldName);
                    if (isNumericField && val != null && !isNaN(val)) {
                        val = this.format_number(val);
                        if (val === 0 || val === '0') val = '-';
                    }
                    if (val == null) val = '';

                    td.textContent = val;
                    td.setAttribute('data-field', fieldName);

                    // 条件属性：样式与链接
                    this._applyCondToTd(td, row, fieldName);

                    // 冻结列
                    const rowFieldCount = this.elradio_contentType === 'tree' ? 1 : this.rows_fieldList.length;
                    if (this.elradio_autoFrozenCols === 'true' && j < this.frozenCols) {
                        td.classList.add('frozen_col');
                    }

                    tr.appendChild(td);
                }

                fragment.appendChild(tr);
            }

            // 在底部占位行前插入
            tbody.insertBefore(fragment, spacerBottom);
        }

        /**
         * 渲染Tree模式可见行
         */
        /**
         * 应用条件属性的样式与链接到单元格
         */
        _applyCondToTd(td, row, fieldName) {
            const cellStyle = row[fieldName + '_cell_style'];
            if (cellStyle) {
                if (cellStyle.backgroundColor) td.style.backgroundColor = cellStyle.backgroundColor;
                if (cellStyle.color) td.style.color = cellStyle.color;
                if (cellStyle.fontSize) td.style.fontSize = cellStyle.fontSize;
            }
            const linkUrl = row[fieldName + '_linkUrl'];
            if (linkUrl) {
                td.style.cursor = 'pointer';
                td.style.color = td.style.color || '#1116e7';
                td.style.textDecoration = 'underline';
                const linkTarget = row[fieldName + '_linkTarget'];
                td.addEventListener('click', () => this._openCondLink(linkUrl, linkTarget));
            }
        }

        /**
         * 打开条件属性链接
         */
        _openCondLink(url, target) {
            if (!url) return;
            if (target === '_blank') window.open(url, '_blank');
            else if (target === '_self') window.location.href = url;
            else if (target === '_open') window.open(url, '_blank');
            else window.open(url, '_blank');
        }

        _renderTreeVisibleRows(tbody, spacerBottom, startIdx, endIdx) {
            const flatNodes = this._flatTreeNodes;
            if (!flatNodes || flatNodes.length === 0) return;

            const fragment = document.createDocumentFragment();

            for (let i = startIdx; i < endIdx; i++) {
                const node = flatNodes[i];
                if (!node) continue;

                const tr = document.createElement('tr');
                tr.setAttribute('data-level', node.level);
                // 虚拟滚动时，基于数据行索引添加奇偶行样式
                if (i % 2 === 1) {
                    tr.classList.add('virtual_row_even');
                }

                for (let j = 0; j < this.arr_filter_vals.length; j++) {
                    const fieldName = this.arr_filter_vals[j];
                    const td = document.createElement('td');

                    if (j === 0) {
                        // 树节点列（第一个字段）：渲染缩进+展开/折叠图标
                        const indent = '\u00a0\u00a0\u00a0\u00a0'.repeat(node.level);
                        const hasChildren = node.children && node.children.length > 0;
                        const expandIcon = hasChildren
                            ? `<span class="tree_expand_icon" data-key="${node.key}">${this._isNodeExpanded(node) ? '▼' : '▶'}</span>`
                            : '<span style="display:inline-block;width:16px;"></span>';
                        td.innerHTML = `${indent}${expandIcon}${node['tree_nodeName'] || node.key}`;
                        td.style.textAlign = 'left';
                    } else {
                        // 数值列或组合列
                        let val = node[fieldName];
                        const isNumericField = this._isNumericCell(node, fieldName);
                        if (isNumericField && val != null && !isNaN(val)) {
                            val = this.format_number(val);
                            if (val === 0 || val === '0') val = '-';
                        }
                        if (val == null || val === '') val = '-';
                        td.textContent = val;
                        td.setAttribute('data-field', fieldName);

                        // 条件属性：样式与链接
                        this._applyCondToTd(td, node, fieldName);

                        // 冻结列
                        if (this.elradio_autoFrozenCols === 'true' && j < this.frozenCols) {
                            td.classList.add('frozen_col');
                        }
                    }

                    tr.appendChild(td);
                }

                fragment.appendChild(tr);
            }

            tbody.insertBefore(fragment, spacerBottom);
        }

        /**
         * 更新虚拟滚动占位行高度
         */
        _updateVirtualSpacers(startIdx, endIdx, totalRows) {
            const rowHeight = this._rowHeight;
            const spacerTop = this.$.spacerTop;
            const spacerBottom = this.$.spacerBottom;

            if (spacerTop) {
                const td = spacerTop.querySelector('td');
                const h = startIdx * rowHeight;
                if (td) td.style.height = h + 'px';
                spacerTop.style.height = h + 'px';
            }
            if (spacerBottom) {
                const td = spacerBottom.querySelector('td');
                const h = Math.max(0, totalRows - endIdx) * rowHeight;
                if (td) td.style.height = h + 'px';
                spacerBottom.style.height = h + 'px';
            }
        }

        /**
         * 重置占位行（非虚拟模式时）
         */
        _resetSpacers() {
            const spacerTop = this.$.spacerTop;
            const spacerBottom = this.$.spacerBottom;
            if (spacerTop) spacerTop.style.height = '0';
            if (spacerBottom) spacerBottom.style.height = '0';
        }

        /**
         * 构建树状数据的扁平化列表（用于虚拟滚动）
         */
        _flattenTreeNodes() {
            this._flatTreeNodes = [];
            const treeNodes = this.ux_grid_treeData || [];

            const flatten = (nodes, level) => {
                for (let node of nodes) {
                    const flatNode = Object.assign({}, node);
                    flatNode.level = level;
                    this._flatTreeNodes.push(flatNode);
                    if (node.children && this._isNodeExpanded(node)) {
                        flatten(node.children, level + 1);
                    }
                }
            };

            flatten(treeNodes, 0);
        }

        /**
         * 构建全展开的树状数据扁平列表（用于导出，忽略展开/折叠状态）
         */
        _flattenAllTreeNodes() {
            const allNodes = [];
            const treeNodes = this.ux_grid_treeData || [];

            const flatten = (nodes, level) => {
                for (let node of nodes) {
                    const flatNode = Object.assign({}, node);
                    flatNode.level = level;
                    flatNode._expanded = true;
                    allNodes.push(flatNode);
                    if (node.children && node.children.length > 0) {
                        flatten(node.children, level + 1);
                    }
                }
            };

            flatten(treeNodes, 0);
            return allNodes;
        }

        // ==================== 列宽拖拽 ====================

        /**
         * 创建colgroup元素控制列宽
         */
        _addColgroup() {
            const table = this.$.table;
            if (!table) return;

            // 移除旧colgroup
            const existing = table.querySelector('colgroup');
            if (existing) existing.remove();

            const hasCustomWidths = Object.keys(this.columnWidths).length > 0;

            // 如果有自定义列宽，先捕获当前auto模式的列宽，再切换到fixed
            if (hasCustomWidths) {
                this._captureAutoColumnWidths();
                table.style.tableLayout = 'fixed';
            } else {
                table.style.tableLayout = '';
                table.style.width = '';
                table.style.minWidth = '';
            }

            const colgroup = document.createElement('colgroup');
            let totalWidth = 0;
            for (let i = 0; i < this.arr_filter_vals.length; i++) {
                const col = document.createElement('col');
                const fieldName = this.arr_filter_vals[i];
                let w = 0;
                if (this.columnWidths[fieldName]) {
                    w = parseFloat(this.columnWidths[fieldName]) || 0;
                } else if (hasCustomWidths && this._autoColWidths && this._autoColWidths[fieldName]) {
                    // fixed模式下，无自定义宽度的列使用之前捕获的自动宽度
                    w = parseFloat(this._autoColWidths[fieldName]) || 0;
                }
                if (hasCustomWidths) {
                    // 无宽度列兜底（保证 fixed 布局总宽确定）
                    if (!w || w < 40) w = 100;
                    col.style.width = w + 'px';
                    totalWidth += w;
                }
                colgroup.appendChild(col);
            }
            table.insertBefore(colgroup, table.firstChild);

            // 关键：CSS 里表格是 width:max-content，该值会让 table-layout:fixed 退化——
            // 浏览器仍按当前可见行内容重算表格宽度，列宽随虚拟滚动跳变。
            // 必须给表格设定确定像素宽度（各列宽之和），fixed 布局才真正锁死列宽。
            if (hasCustomWidths && totalWidth > 0) {
                table.style.width = totalWidth + 'px';
                table.style.minWidth = totalWidth + 'px';
            }
        }

        /**
         * 捕获当前所有列的自动计算宽度（在切换到fixed之前调用）
         */
        _captureAutoColumnWidths() {
            // 每次表格重建时都重新捕获
            this._autoColWidths = {};

            const thead = this.$.thead;
            if (!thead) return;

            // 遍历所有叶子列th，记录它们的当前渲染宽度
            const rows = thead.querySelectorAll('tr');
            for (let r = 0; r < rows.length; r++) {
                const ths = rows[r].querySelectorAll('th');
                for (let th of ths) {
                    const start = parseInt(th.getAttribute('data-leaf-col-start'));
                    const end = parseInt(th.getAttribute('data-leaf-col-end'));
                    if (isNaN(start) || isNaN(end) || start !== end) continue;

                    const fieldName = this.arr_filter_vals[start];
                    if (fieldName && !this.columnWidths[fieldName]) {
                        this._autoColWidths[fieldName] = th.getBoundingClientRect().width;
                    }
                }
            }
        }

        /**
         * 持久化列宽到 localStorage
         */
        _saveColumnWidths() {
            if (!this._reportKey) return;
            try {
                localStorage.setItem(this._reportKey + 'columnWidths', JSON.stringify(this.columnWidths));
            } catch (e) { /* ignore */ }
        }

        /**
         * 从 localStorage 恢复列宽
         */
        _loadSavedColumnWidths() {
            if (!this._reportKey) return;
            try {
                const raw = localStorage.getItem(this._reportKey + 'columnWidths');
                if (raw) this.columnWidths = JSON.parse(raw) || {};
            } catch (e) { /* ignore */ }
        }

        /**
         * 首次渲染后固化列宽：捕获所有列当前宽度并固定，避免随内容/数据变化
         */
        _fixColumnWidthsOnce() {
            if (this._colWidthsFixed) return;
            if (Object.keys(this.columnWidths).length > 0) {
                // 已从 localStorage 恢复或手动拖拽过，直接固定
                this._colWidthsFixed = true;
                return;
            }
            // 强制 reflow，确保浏览器完成 auto 布局计算后再捕获真实列宽
            void this.$.table.offsetWidth;
            // 捕获当前所有叶子列宽度
            this._captureAutoColumnWidths();
            const captured = this._autoColWidths || {};
            const keys = Object.keys(captured);
            if (keys.length === 0) return;
            // 把捕获的宽度合并进 columnWidths（后续由 _renderTable 的 _addColgroup 走 fixed 布局）
            this.columnWidths = Object.assign({}, captured);
            this._colWidthsFixed = true;
            this._saveColumnWidths();
        }

        /**
         * 计算每个th对应的叶子列索引范围，存储为data属性
         */
        _computeThColMapping() {
            const thead = this.$.thead;
            if (!thead) return;

            const rows = thead.querySelectorAll('tr');
            const totalCols = this.arr_filter_vals.length;
            if (totalCols === 0) return;

            // 构建网格追踪每个th占据的列位置
            const grid = [];
            for (let r = 0; r < rows.length; r++) {
                grid[r] = new Array(totalCols).fill(null);
            }

            for (let r = 0; r < rows.length; r++) {
                const cells = rows[r].querySelectorAll('th');
                let colCursor = 0;
                for (let c = 0; c < cells.length; c++) {
                    const th = cells[c];
                    const colspan = parseInt(th.getAttribute('colspan')) || 1;
                    const rowspan = parseInt(th.getAttribute('rowspan')) || 1;

                    // 找到该行下一个空位列
                    while (colCursor < totalCols && grid[r][colCursor] !== null) colCursor++;

                    // 填充网格
                    for (let dr = 0; dr < rowspan; dr++) {
                        for (let dc = 0; dc < colspan; dc++) {
                            if (r + dr < rows.length && colCursor + dc < totalCols) {
                                grid[r + dr][colCursor + dc] = th;
                            }
                        }
                    }

                    // 设置数据属性
                    th.setAttribute('data-leaf-col-start', colCursor);
                    th.setAttribute('data-leaf-col-end', colCursor + colspan - 1);

                    colCursor += colspan;
                }
            }
        }

        /**
         * 应用存储的自定义列宽到th元素和colgroup
         */
        _applyColumnWidths() {
            const thead = this.$.thead;
            if (!thead) return;

            // 应用到thead中的th元素
            const rows = thead.querySelectorAll('tr');
            for (let r = 0; r < rows.length; r++) {
                const ths = rows[r].querySelectorAll('th');
                for (let th of ths) {
                    const start = parseInt(th.getAttribute('data-leaf-col-start'));
                    const end = parseInt(th.getAttribute('data-leaf-col-end'));
                    if (isNaN(start) || isNaN(end)) continue;

                    const isLeaf = (start === end);
                    const fieldName = this.arr_filter_vals[start];

                    if (isLeaf && this.columnWidths[fieldName]) {
                        // 叶子列：直接设置自定义宽度
                        th.style.width = this.columnWidths[fieldName] + 'px';
                        th.style.minWidth = this.columnWidths[fieldName] + 'px';
                    } else if (!isLeaf) {
                        // 非叶子列：检查子列是否有自定义宽度
                        let hasCustom = false;
                        let totalWidth = 0;
                        for (let i = start; i <= end; i++) {
                            const fn = this.arr_filter_vals[i];
                            if (this.columnWidths[fn]) {
                                hasCustom = true;
                                totalWidth += this.columnWidths[fn];
                            }
                        }
                        if (hasCustom) {
                            // 移除原有的minWidth让浏览器自动计算，但设置最小宽度
                            th.style.minWidth = Math.max(totalWidth, 50 * (end - start + 1)) + 'px';
                        }
                    }
                }
            }

            // 同步colgroup宽度
            const colgroup = this.$.table.querySelector('colgroup');
            if (colgroup) {
                const cols = colgroup.querySelectorAll('col');
                for (let i = 0; i < cols.length && i < this.arr_filter_vals.length; i++) {
                    const fieldName = this.arr_filter_vals[i];
                    if (this.columnWidths[fieldName]) {
                        cols[i].style.width = this.columnWidths[fieldName] + 'px';
                    }
                }
            }
        }

        /**
         * 初始化列宽拖拽交互
         */
        _initColumnResize() {
            const self = this;
            const thead = this.$.thead;
            const table = this.$.table;
            if (!thead || !table) return;

            // 避免重复绑定事件
            if (this._colResizeInitialized) return;
            this._colResizeInitialized = true;

            let isResizing = false;
            let resizeLeafEnd = -1;
            let startX = 0;
            let startLeafWidth = 0;
            let resizeLine = null;
            let lastHoverTh = null;  // 上次悬浮的th，用于清理样式

            // 获取或创建拖拽指示线
            function getResizeLine() {
                if (!resizeLine) {
                    resizeLine = document.createElement('div');
                    resizeLine.className = 'col_resize_line';
                    document.body.appendChild(resizeLine);
                }
                return resizeLine;
            }

            // 鼠标在thead上移动 - 检测是否靠近th右边缘
            thead.addEventListener('mousemove', function(e) {
                if (isResizing) return;
                const th = e.target.closest('th');
                if (!th) {
                    // 离开th区域时清理上一个th的hover样式
                    if (lastHoverTh) {
                        lastHoverTh.classList.remove('col-resize-hover');
                        lastHoverTh = null;
                    }
                    return;
                }

                // 检查是否是筛选/排序等交互元素
                if (e.target.classList.contains('col_filter_icon') ||
                    e.target.classList.contains('col_sort_flag') ||
                    e.target.classList.contains('col_filter_count')) {
                    if (lastHoverTh) {
                        lastHoverTh.classList.remove('col-resize-hover');
                        lastHoverTh.style.cursor = '';
                        lastHoverTh = null;
                    }
                    return;
                }

                const rect = th.getBoundingClientRect();
                const nearRight = rect.right - e.clientX < 6 && rect.right - e.clientX >= -2;

                // 清理上一个th的hover样式
                if (lastHoverTh && lastHoverTh !== th) {
                    lastHoverTh.classList.remove('col-resize-hover');
                    lastHoverTh.style.cursor = '';
                }

                if (nearRight) {
                    th.style.cursor = 'col-resize';
                    th.classList.add('col-resize-hover');
                    lastHoverTh = th;
                } else {
                    th.style.cursor = '';
                    th.classList.remove('col-resize-hover');
                    lastHoverTh = null;
                }
            });

            // 鼠标离开thead时清理hover样式
            thead.addEventListener('mouseleave', function() {
                if (lastHoverTh) {
                    lastHoverTh.classList.remove('col-resize-hover');
                    lastHoverTh.style.cursor = '';
                    lastHoverTh = null;
                }
            });

            // 鼠标在thead上按下 - 开始拖拽
            thead.addEventListener('mousedown', function(e) {
                const th = e.target.closest('th');
                if (!th) return;

                // 检查是否点击了筛选/排序等交互元素
                if (e.target.classList.contains('col_filter_icon') ||
                    e.target.classList.contains('col_sort_flag') ||
                    e.target.classList.contains('col_filter_count')) return;

                const rect = th.getBoundingClientRect();
                const nearRight = rect.right - e.clientX < 6 && rect.right - e.clientX >= -2;

                if (!nearRight) return;

                e.preventDefault();
                e.stopPropagation();

                isResizing = true;
                resizeLeafEnd = parseInt(th.getAttribute('data-leaf-col-end')) || 0;
                startX = e.clientX;

                // 获取当前叶子列的宽度
                const leafTh = self._getLeafThByIndex(resizeLeafEnd);
                startLeafWidth = leafTh ? leafTh.offsetWidth : 100;

                // 显示拖拽指示线
                const line = getResizeLine();
                const wrapperRect = self.$.tableWrapper.getBoundingClientRect();
                line.style.display = 'block';
                line.style.left = rect.right + 'px';
                line.style.top = wrapperRect.top + 'px';
                line.style.height = wrapperRect.height + 'px';

                document.addEventListener('mousemove', onDocMouseMove);
                document.addEventListener('mouseup', onDocMouseUp);
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            function onDocMouseMove(e) {
                if (!isResizing) return;
                e.preventDefault();

                const diff = e.clientX - startX;
                const line = getResizeLine();
                line.style.left = (startX + diff) + 'px';
            }

            function onDocMouseUp(e) {
                if (!isResizing) return;

                const diff = e.clientX - startX;
                const newWidth = Math.max(30, startLeafWidth + diff);

                // 存储叶子列的新宽度
                if (resizeLeafEnd >= 0 && resizeLeafEnd < self.arr_filter_vals.length) {
                    const fieldName = self.arr_filter_vals[resizeLeafEnd];
                    self.columnWidths[fieldName] = newWidth;
                }
                // 持久化列宽
                self._saveColumnWidths();
                // 同步到 window.cus_umytable（report_descript.rpt_cfg_columnWidths）
                self._syncWindowObject();

                // 应用列宽
                self._addColgroup();
                self._computeThColMapping();
                self._applyColumnWidths();

                // 清理
                isResizing = false;
                resizeLeafEnd = -1;
                document.removeEventListener('mousemove', onDocMouseMove);
                document.removeEventListener('mouseup', onDocMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                const line = getResizeLine();
                line.style.display = 'none';
            }
        }

        /**
         * 根据叶子列索引获取对应的th元素
         */
        _getLeafThByIndex(leafIndex) {
            const thead = this.$.thead;
            if (!thead) return null;

            const rows = thead.querySelectorAll('tr');
            for (let r = 0; r < rows.length; r++) {
                const ths = rows[r].querySelectorAll('th');
                for (let th of ths) {
                    const start = parseInt(th.getAttribute('data-leaf-col-start'));
                    const end = parseInt(th.getAttribute('data-leaf-col-end'));
                    if (start === leafIndex && end === leafIndex) {
                        return th;
                    }
                }
            }
            return null;
        }

        _renderTreeTable(thead, tbody) {
            // 使用ux_grid_columns渲染完整多级表头（与网格模式一致）
            const maxLevel = this._getMaxHeaderLevel(this.ux_grid_columns, 0);

            for (let lv = 0; lv <= maxLevel; lv++) {
                const tr = document.createElement('tr');
                this._renderHeaderLevel(tr, this.ux_grid_columns, lv, 0);
                thead.appendChild(tr);
            }

            // 扁平化树节点用于虚拟滚动
            this._flattenTreeNodes();

            // 渲染树表体
            const flatNodes = this._flatTreeNodes;
            if (!flatNodes || flatNodes.length === 0) return;

            if (this._virtualEnabled && flatNodes.length > 50) {
                // 虚拟模式：先渲染初始可见行
                const initialEnd = Math.min(30, flatNodes.length);
                this._renderTreeRowsRange(tbody, 0, initialEnd);
            } else {
                // 非虚拟模式：全量渲染
                this._renderTreeRowsRange(tbody, 0, flatNodes.length);
            }

            // 展开/折叠事件（点击图标或第一个单元格均可触发）
            // 仅绑定一次，避免每次刷新重复累加监听器导致 toggle 被抵消
            if (!this._treeExpandBound) {
                this._treeExpandBound = true;
                tbody.addEventListener('click', (e) => {
                    const icon = e.target.closest('.tree_expand_icon');
                    if (icon) {
                        const key = icon.getAttribute('data-key');
                        this._toggleTreeNode(key);
                        return;
                    }
                    // 点击包含 tree_expand_icon 的 td（即第一个字段列）也可展开/折叠
                    const td = e.target.closest('td');
                    if (td) {
                        const iconInTd = td.querySelector('.tree_expand_icon');
                        if (iconInTd) {
                            const key = iconInTd.getAttribute('data-key');
                            this._toggleTreeNode(key);
                        }
                    }
                });
            }
        }

        /**
         * 切换树节点展开/折叠状态
         */
        _toggleTreeNode(key) {
            // 更新持久化的展开key集合
            if (this._expandedTreeKeys.has(key)) {
                this._expandedTreeKeys.delete(key);
            } else {
                this._expandedTreeKeys.add(key);
            }
            this._refreshAll();
        }

        /**
         * 渲染Tree模式指定范围的行
         */
        _renderTreeRowsRange(tbody, startIdx, endIdx) {
            const flatNodes = this._flatTreeNodes;
            if (!flatNodes) return;

            const fragment = document.createDocumentFragment();

            for (let i = startIdx; i < endIdx; i++) {
                const node = flatNodes[i];
                if (!node) continue;

                const tr = document.createElement('tr');
                tr.setAttribute('data-level', node.level);
                // 虚拟滚动时，基于数据行索引添加奇偶行样式
                if (i % 2 === 1) {
                    tr.classList.add('virtual_row_even');
                }

                for (let j = 0; j < this.arr_filter_vals.length; j++) {
                    const fieldName = this.arr_filter_vals[j];
                    const td = document.createElement('td');

                    if (j === 0) {
                        // 树节点列（第一个字段）：渲染缩进+展开/折叠图标
                        const indent = '\u00a0\u00a0\u00a0\u00a0'.repeat(node.level);
                        const hasChildren = node.children && node.children.length > 0;
                        const expandIcon = hasChildren
                            ? `<span class="tree_expand_icon" data-key="${node.key}">${this._isNodeExpanded(node) ? '▼' : '▶'}</span>`
                            : '<span style="display:inline-block;width:16px;"></span>';
                        td.innerHTML = `${indent}${expandIcon}${node['tree_nodeName'] || node.key}`;
                        td.style.textAlign = 'left';
                    } else {
                        // 数值列或组合列
                        let val = node[fieldName];
                        const isNumericField = this._isNumericCell(node, fieldName);
                        if (isNumericField && val != null && !isNaN(val)) {
                            val = this.format_number(val);
                            if (val === 0 || val === '0') val = '-';
                        }
                        if (val == null || val === '') val = '-';
                        td.textContent = val;
                        td.setAttribute('data-field', fieldName);

                        // 条件属性：样式与链接
                        this._applyCondToTd(td, node, fieldName);

                        // 冻结列
                        if (this.elradio_autoFrozenCols === 'true' && j < this.frozenCols) {
                            td.classList.add('frozen_col');
                        }
                    }

                    tr.appendChild(td);
                }

                fragment.appendChild(tr);
            }

            // 在底部占位行前插入
            const spacerBottom = this.$.spacerBottom;
            if (spacerBottom) {
                tbody.insertBefore(fragment, spacerBottom);
            } else {
                tbody.appendChild(fragment);
            }
        }

        _isNodeExpanded(node) {
            if (this.expandTreelevel > node.level + 1) return true;
            // 优先检查持久化的展开key集合
            if (this._expandedTreeKeys.has(node.key)) return true;
            return false;
        }

        _expandToLevel() {
            // 通过expandTreelevel控制展开级数，在_flattenTreeData时已处理
            // 重新触发渲染以保证默认展开
        }

        _renderGridTable(thead, tbody) {
            // 构建多级表头
            const maxLevel = this._getMaxHeaderLevel(this.ux_grid_columns, 0);

            // 渲染表头
            for (let lv = 0; lv <= maxLevel; lv++) {
                const tr = document.createElement('tr');
                this._renderHeaderLevel(tr, this.ux_grid_columns, lv, 0);
                thead.appendChild(tr);
            }

            // 渲染表体
            const dataRows = this.ux_grid_datas;
            if (!dataRows || dataRows.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = this.arr_filter_vals.length || 5;
                td.textContent = '暂无数据';
                td.style.textAlign = 'center';
                td.style.padding = '20px';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }

            // 虚拟滚动模式下，首次全量渲染以测量行高，_initVirtualScroll会再切换
            // 数据量较小时也全量渲染
            if (this._virtualEnabled && dataRows.length > 50) {
                // 先渲染少量初始行用于行高测量
                const initialEnd = Math.min(30, dataRows.length);
                this._renderGridRowsRange(tbody, 0, initialEnd);
            } else {
                // 非虚拟模式或数据量少：全量渲染
                this._renderGridRowsRange(tbody, 0, dataRows.length);
            }
        }

        /**
         * 渲染Grid模式指定范围的行（含合并单元格处理）
         */
        _renderGridRowsRange(tbody, startIdx, endIdx) {
            const dataRows = this.ux_grid_datas;
            if (!dataRows) return;

            // 构建单元格合并查找映射
            const mergeMap = new Map();   // key: "row,col" -> merge info
            const coveredCells = new Set(); // key: "row,col" -> 被覆盖的单元格
            for (let merge of this.cells_merge) {
                const key = `${merge.row},${merge.col}`;
                mergeMap.set(key, merge);
                for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
                    for (let c = merge.col; c < merge.col + merge.colspan; c++) {
                        if (r !== merge.row || c !== merge.col) {
                            coveredCells.add(`${r},${c}`);
                        }
                    }
                }
            }

            const fragment = document.createDocumentFragment();

            for (let i = startIdx; i < endIdx; i++) {
                const row = dataRows[i];
                const tr = document.createElement('tr');

                if (row.type === 'total') {
                    tr.classList.add('subtotal_row');
                }
                // 虚拟滚动时，基于数据行索引添加奇偶行样式
                if (i % 2 === 1) {
                    tr.classList.add('virtual_row_even');
                }

                for (let j = 0; j < this.arr_filter_vals.length; j++) {
                    // 跳过被合并覆盖的单元格
                    if (coveredCells.has(`${i},${j}`)) continue;

                    const td = document.createElement('td');

                    // 应用合并属性
                    const merge = mergeMap.get(`${i},${j}`);
                    if (merge) {
                        if (merge.rowspan > 1) {
                            // 虚拟滚动时，如果合并起始行在可见区域上方，截断rowspan
                            if (i === merge.row && merge.row < startIdx) {
                                const visibleRowspan = Math.min(merge.rowspan, merge.row + merge.rowspan - startIdx);
                                td.rowSpan = visibleRowspan;
                            } else {
                                td.rowSpan = merge.rowspan;
                            }
                        }
                        if (merge.colspan > 1) td.colSpan = merge.colspan;
                    }

                    const fieldName = this.arr_filter_vals[j];
                    let val = row[fieldName];

                    // 格式化数值
                    const isNumericField = this._isNumericCell(row, fieldName);
                    if (isNumericField && val != null && !isNaN(val)) {
                        val = this.format_number(val);
                        if (val === 0 || val === '0') val = '-';
                    }
                    if (val == null) val = '';

                    td.textContent = val;
                    td.setAttribute('data-field', fieldName);

                    // 条件属性：样式与链接
                    this._applyCondToTd(td, row, fieldName);

                    // 冻结列
                    if (this.elradio_autoFrozenCols === 'true' && j < this.frozenCols) {
                        td.classList.add('frozen_col');
                    }

                    tr.appendChild(td);
                }

                fragment.appendChild(tr);
            }

            // 在底部占位行前插入
            const spacerBottom = this.$.spacerBottom;
            if (spacerBottom) {
                tbody.insertBefore(fragment, spacerBottom);
            } else {
                tbody.appendChild(fragment);
            }
        }

        _getMaxHeaderLevel(columns, currentLevel) {
            let max = currentLevel;
            for (let col of columns) {
                if (col.children && col.children.length > 0) {
                    const childMax = this._getMaxHeaderLevel(col.children, currentLevel + 1);
                    if (childMax > max) max = childMax;
                }
            }
            return max;
        }

        _renderHeaderLevel(tr, columns, targetLevel, currentLevel) {
            if (currentLevel === targetLevel) {
                for (let col of columns) {
                    const th = document.createElement('th');
                    const isLeaf = !col.children || col.children.length === 0;
                    if (isLeaf) {
                        th.innerHTML = this._buildHeaderCell(col.title, false);
                    } else {
                        th.textContent = col.title;
                    }
                    th.setAttribute('colspan', this._getLeafCount(col));
                    th.setAttribute('rowspan', isLeaf ? (this._getMaxHeaderLevel(this.ux_grid_columns, 0) - targetLevel + 1) : 1);
                    th.style.minWidth = (col.minWidth || 100) + 'px';
                    if (col.isSubtotal) th.style.color = '#0b46f5';
                    // 如果有筛选条件，给表头添加筛选标记
                    const filterVals = this.filter_fieldlist[col.title];
                    if (filterVals && filterVals.length > 0) {
                        th.classList.add('col_filtered');
                    }
                    tr.appendChild(th);
                }
            } else if (currentLevel < targetLevel) {
                for (let col of columns) {
                    if (col.children && col.children.length > 0) {
                        this._renderHeaderLevel(tr, col.children, targetLevel, currentLevel + 1);
                    }
                }
            }
        }

        _getLeafCount(col) {
            if (!col.children || col.children.length === 0) return 1;
            return col.children.reduce((sum, c) => sum + this._getLeafCount(c), 0);
        }

        _bindTableHeaderEvents() {
            const self = this;
            const thead = this.$.thead;
            if (!thead) return;

            // 绑定筛选图标点击
            thead.querySelectorAll('.col_filter_icon').forEach(icon => {
                icon.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const field = this.getAttribute('data-field');
                    if (field) {
                        self._showFilterPanel(field, e);
                    }
                });
            });

            // 绑定表头文本点击排序
            thead.querySelectorAll('th').forEach(th => {
                th.addEventListener('click', function(e) {
                    // 如果点击的是筛选图标则跳过排序
                    if (e.target.classList.contains('col_filter_icon')) return;
                    const headerSpan = this.querySelector('.col_header');
                    if (!headerSpan) return;
                    // 获取字段名：取col_header中第一个文本节点
                    let field = '';
                    headerSpan.childNodes.forEach(node => {
                        if (node.nodeType === 3 && node.textContent.trim()) {
                            field = node.textContent.trim();
                        }
                    });
                    if (!field) field = this.textContent.trim();
                    if (!field) return;
                    // 切换排序
                    const cur = self.orderby_fields[field];
                    if (self.report_type === 'detail') {
                        // 明细模式：单字段排序——点新字段时替换全部；循环 asc → desc → count → 清除
                        if (cur === 'asc') {
                            self.orderby_fields = { [field]: 'desc' };
                        } else if (cur === 'desc') {
                            self.orderby_fields = { [field]: 'count' };
                        } else {
                            self.orderby_fields = { [field]: 'asc' };
                        }
                    } else if (cur === 'asc') {
                        self.orderby_fields[field] = 'desc';
                    } else if (cur === 'desc') {
                        self.orderby_fields[field] = 'count';
                    } else if (cur === 'count') {
                        delete self.orderby_fields[field];
                    } else {
                        self.orderby_fields[field] = 'asc';
                    }
                    self._refreshAll();
                });
            });
        }

        _buildHeaderCell(title, isTree) {
            let html = `<span class="col_header">${title}`;
            // 排序标记
            const order = this.orderby_fields[title];
            if (order === 'asc') html += `<span class="col_sort_flag"> ↑</span>`;
            else if (order === 'desc') html += `<span class="col_sort_flag"> ↓</span>`;
            else if (order === 'count') html += `<span class="col_sort_flag"> #</span>`;
            // 筛选计数
            const filterVals = this.filter_fieldlist[title];
            if (filterVals && filterVals.length > 0) {
                html += `<span class="col_filter_count">【筛选数:${filterVals.length}】</span>`;
            }
            // 筛选图标
            html += `<span class="col_filter_icon" data-field="${title}">${this._icon('caret_down')}</span>`;
            html += `</span>`;
            return html;
        }

        // ==================== 筛选面板 ====================
        _showFilterPanel(fieldName, event) {
            this.sel_tagtext = fieldName;
            this.sel_divIsShow = true;
            this.filter_sort_mode = 'asc';  // 重置排序模式
            const panel = this.$.filterPanel;

            // 计算每个值的出现次数
            this.filter_value_counts = {};
            const allValues = this._getColumnValues(fieldName);
            for (let v of allValues) {
                this.filter_value_counts[v] = this.rsp_datalist.filter(item => String(item[fieldName] != null ? item[fieldName] : '') === v).length;
            }

            // 同步筛选面板排序模式为当前字段的组内排序模式
            const currentOrder = this.orderby_fields[fieldName];
            if (currentOrder === 'asc' || currentOrder === 'desc' || currentOrder === 'count') {
                this.filter_sort_mode = currentOrder;
            }

            // 按当前排序模式排序
            const sortedValues = this._sortFilterValues(allValues, this.filter_sort_mode);

            // 构建筛选列表
            const filterVals = this.filter_fieldlist[fieldName] || [];
            this.$.filterList.innerHTML = sortedValues.map(v => `
                <div class="filter_item" data-value="${this._escapeAttr(v)}">
                    <input type="checkbox" value="${this._escapeAttr(v)}" ${filterVals.includes(v) ? 'checked' : ''}>
                    <span class="filter_item_text">${v}</span>
                    <span class="filter_item_count">(${this.filter_value_counts[v] || 0})</span>
                </div>
            `).join('');

            // 全选默认未选中：仅当已有筛选且覆盖全部值时才勾选
            this.$.filterCheckAll.checked = filterVals.length > 0 && filterVals.length === sortedValues.length;
            this.$.filterSearch.value = '';

            // 更新排序按钮状态
            this._updateFilterSortButtons();

            // 定位 - 基于触发按钮位置，紧贴按钮下方
            panel.classList.add('show');
            const wrapperRect = this.$.wrapper.getBoundingClientRect();
            const triggerEl = event.target.closest('.tag_filter, .col_filter_icon') || event.target;
            const triggerRect = triggerEl.getBoundingClientRect();

            let top = triggerRect.bottom - wrapperRect.top + 2;
            let left = triggerRect.left - wrapperRect.left;

            // 确保面板不超出容器底部
            const panelHeight = panel.offsetHeight || 300;
            if (top + panelHeight > wrapperRect.height) {
                top = triggerRect.top - wrapperRect.top - panelHeight - 2;
            }

            // 确保面板不超出容器右侧
            const panelWidth = panel.offsetWidth || 220;
            if (left + panelWidth > wrapperRect.width) {
                left = wrapperRect.width - panelWidth - 5;
            }

            panel.style.top = Math.max(0, top) + 'px';
            panel.style.left = Math.max(0, left) + 'px';
        }

        _sortFilterValues(values, mode) {
            const arr = [...values];
            if (mode === 'asc') {
                arr.sort((a, b) => String(a).localeCompare(String(b)));
            } else if (mode === 'desc') {
                arr.sort((a, b) => String(b).localeCompare(String(a)));
            } else if (mode === 'count') {
                arr.sort((a, b) => (this.filter_value_counts[b] || 0) - (this.filter_value_counts[a] || 0));
            }
            return arr;
        }

        _updateFilterSortButtons() {
            const bar = this.$.filterPanel.querySelector('#cus_filter_sort_bar');
            if (!bar) return;
            bar.querySelectorAll('.filter_sort_btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-sort') === this.filter_sort_mode);
            });
        }

        _onFilterSortClick(mode) {
            this.filter_sort_mode = mode;

            // 同步到表格组内排序
            const fieldName = this.sel_tagtext;
            if (mode === 'asc' || mode === 'desc' || mode === 'count') {
                if (this.report_type === 'detail') {
                    // 明细模式：单字段排序，替换全部
                    this.orderby_fields = { [fieldName]: mode };
                } else {
                    this.orderby_fields[fieldName] = mode;
                }
            }

            // 保存当前选中状态
            const checkedValues = [];
            this.$.filterList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                checkedValues.push(cb.value);
            });

            // 重新排序并渲染列表
            const allValues = this._getColumnValues(this.sel_tagtext);
            const sortedValues = this._sortFilterValues(allValues, mode);
            const filterVals = this.filter_fieldlist[this.sel_tagtext] || [];

            this.$.filterList.innerHTML = sortedValues.map(v => `
                <div class="filter_item" data-value="${this._escapeAttr(v)}">
                    <input type="checkbox" value="${this._escapeAttr(v)}" ${checkedValues.includes(v) ? 'checked' : ''}>
                    <span class="filter_item_text">${v}</span>
                    <span class="filter_item_count">(${this.filter_value_counts[v] || 0})</span>
                </div>
            `).join('');

            // 应用搜索过滤
            const searchVal = this.$.filterSearch.value;
            if (searchVal) this._filterSearchInput(searchVal);

            // 更新排序按钮状态
            this._updateFilterSortButtons();

            // 刷新表格以应用组内排序
            this._refreshAll();
        }

        _filterSearchInput(val) {
            const items = this.$.filterList.querySelectorAll('.filter_item');
            items.forEach(item => {
                const textEl = item.querySelector('.filter_item_text');
                const text = textEl ? textEl.textContent.toLowerCase() : '';
                item.style.display = val ? (text.includes(val.toLowerCase()) ? '' : 'none') : '';
            });
        }

        _filterCheckAll(checked) {
            this.$.filterList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = checked;
            });
        }

        _escapeAttr(val) {
            return String(val == null ? '' : val)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        _filterConfirm() {
            const values = [];
            this.$.filterList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                values.push(cb.value);
            });
            const allValues = this._getColumnValues(this.sel_tagtext);
            if (values.length === 0 || values.length === allValues.length) {
                delete this.filter_fieldlist[this.sel_tagtext];
            } else {
                this.filter_fieldlist[this.sel_tagtext] = values;
            }
            this.sel_divIsShow = false;
            this.$.filterPanel.classList.remove('show');
            this._refreshAll();
        }

        _filterReset() {
            delete this.filter_fieldlist[this.sel_tagtext];
            this.sel_divIsShow = false;
            this.$.filterPanel.classList.remove('show');
            this._refreshAll();
        }

        // ==================== 格式化 ====================
        /**
         * 单元格是否按数值格式化：数值字段，或条件属性产生的新值
         * （条件属性的 newValue 同样遵循千分位/小数保留位规则）
         */
        _isNumericCell(row, fieldName) {
            if (this.numerics_fieldlist.some(nf => fieldName.includes(nf.name))) return true;
            return !!(row && row[fieldName + '_cond_newvalue']);
        }

        format_number(num) {
            let val = parseFloat(num);
            if (isNaN(val)) return num;
            val = parseFloat(val.toFixed(this.ipt_decimalPlaces));
            if (this.elradio_separator === 'true') {
                return new Intl.NumberFormat('en-US').format(val);
            }
            return val;
        }

        // ==================== 导出/打印 ====================
        /**
         * 将可能含HTML标签/实体的字符串转为纯文本（实体解码 + 剥离标签），
         * 避免导出Excel时单元格出现html标签元素
         */
        _htmlToText(s) {
            if (s == null) return '';
            const ta = document.createElement('textarea');
            ta.innerHTML = String(s);
            return ta.value.replace(/<[^>]*>/g, '');
        }

        /**
         * Excel 数字单元格格式：按当前「千分位/小数保留位」设置生成
         */
        _exportNumberFormat() {
            const d = Math.max(0, Math.min(10, parseInt(this.ipt_decimalPlaces) || 0));
            const base = this.elradio_separator === 'true' ? '#,##0' : '0';
            return base + (d > 0 ? '.' + '0'.repeat(d) : '');
        }

        exportExcel() {
            this._showLoading();
            setTimeout(() => {
                try {
                    const html = this._buildStyledExportHTML();
                    this._downloadXLS(html);
                } catch (err) {
                    console.error('导出失败', err);
                    alert('导出失败: ' + err.message);
                }
                this._hideLoading();
            }, 100);
        }

        _buildStyledExportHTML() {
            const colCount = this.arr_filter_vals.length;
            const escHtml = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const title = escHtml(this._htmlToText(this.rpt_des_name));
            const remark = escHtml(this._htmlToText(this.rpt_des_remark));
            const exportDate = this._formatDate(new Date());

            // 公共样式：与页面一致——黑色网格线、灰色表头、13px 字号
            const B = '1px solid #000000';
            const FF = "'微软雅黑','Microsoft YaHei',Arial,sans-serif";
            const FS = '13px';
            const P = '6px 10px';

            this._exportHTML = '';

            // 列宽：行字段列稍宽，数值列 100px（与页面 min-width 一致）
            const rowFieldCount = this.elradio_contentType === 'tree' ? 1 : this.rows_fieldList.length;
            const colDefs = [];
            for (let cj = 0; cj < colCount; cj++) {
                let w = 100;
                if (cj < rowFieldCount) w = (this.elradio_contentType === 'tree' && cj === 0) ? 180 : 130;
                colDefs.push('<col width="' + w + '">');
            }
            this._exportHTML += '<colgroup>' + colDefs.join('') + '</colgroup>';

            // 标题区（无边框，干净的报告抬头）
            this._exportHTML += '<tr>';
            this._exportHTML += '<td colspan="' + colCount + '" style="text-align:center;font-weight:bold;font-size:16px;font-family:' + FF + ';padding:10px 10px 0;">' + title + '</td>';
            this._exportHTML += '</tr>';

            // 备注行
            this._exportHTML += '<tr>';
            this._exportHTML += '<td colspan="' + colCount + '" style="text-align:left;font-size:12px;color:#909399;font-family:' + FF + ';padding:2px 10px 0;">' + remark + '</td>';
            this._exportHTML += '</tr>';

            // 导出时间行
            this._exportHTML += '<tr>';
            this._exportHTML += '<td colspan="' + colCount + '" style="text-align:right;font-size:11px;color:#999;font-family:' + FF + ';padding:2px 10px 8px;">导出时间：' + exportDate + '</td>';
            this._exportHTML += '</tr>';

            // 多级表头
            const maxLevel = this._getMaxHeaderLevel(this.ux_grid_columns, 0);
            // 冻结窗格：标题区3行 + 多级表头
            this._exportFreezeRows = 3 + maxLevel + 1;
            // 总叶子列数（用于定位行末单元格补右边线）
            let totalLeaves = 0;
            for (const tc of this.ux_grid_columns) totalLeaves += this._countLeafColumns(tc);
            const lastCol = totalLeaves - 1;
            const hasTotalRow = !!this._rowAlltotalData;
            for (let lv = 0; lv <= maxLevel; lv++) {
                this._exportHTML += '<tr>';
                const leafPos = { v: 0 };
                this._renderExportHeaderLevel(this.ux_grid_columns, lv, 0, maxLevel, totalLeaves, leafPos);
                this._exportHTML += '</tr>';
            }

            // 数据行
            const isTree = this.elradio_contentType === 'tree';
            let dataRows;
            if (isTree) {
                // 导出时默认展开所有节点，构建全展开的扁平列表
                dataRows = this._flattenAllTreeNodes();
            } else {
                dataRows = this.ux_grid_datas;
            }

            // 合并单元格映射（仅grid模式）
            const mergeMap = new Map();
            const coveredCells = new Set();
            if (!isTree) {
                for (let merge of this.cells_merge) {
                    mergeMap.set(merge.row + ',' + merge.col, merge);
                    for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
                        for (let c = merge.col; c < merge.col + merge.colspan; c++) {
                            if (r !== merge.row || c !== merge.col) {
                                coveredCells.add(r + ',' + c);
                            }
                        }
                    }
                }
            }

            // 常规单元格透明背景；小计行蓝色加粗（同页面）；总计行 #f0f2f5；
            // 条件属性设置的样式最后覆盖；数值单元格附加 Excel 数字格式（千分位+小数位），
            // 文本单元格强制文本格式（避免日期/编号被 Excel 自动转换）
            const numFormat = this._exportNumberFormat();
            const buildCellStyle = (rowItem, fieldName) => {
                let style = 'font-family:' + FF + ';font-size:' + FS + ';padding:' + P + ';text-align:center;white-space:nowrap;border-top:' + B + ';border-left:' + B + ';';
                if (rowItem.type === 'grand_total') {
                    style += 'background:#f0f2f5;color:#333;font-weight:bold;';
                } else if (rowItem.type === 'total') {
                    style += 'color:#337ab7;font-weight:bold;';
                } else {
                    style += 'color:#333;';
                }
                const cond = rowItem[fieldName + '_cell_style'];
                if (cond) {
                    if (cond.backgroundColor) style += 'background:' + cond.backgroundColor + ';';
                    if (cond.color) style += 'color:' + cond.color + ';';
                    if (cond.fontSize) {
                        const fz = /^\d+(\.\d+)?$/.test(String(cond.fontSize)) ? cond.fontSize + 'px' : cond.fontSize;
                        style += 'font-size:' + fz + ';';
                    }
                }
                if (this._isNumericCell(rowItem, fieldName)) {
                    style += "mso-number-format:'" + numFormat + "';";
                } else {
                    style += "mso-number-format:'\\@';";
                }
                return style;
            };
            // 细边框方案：单元格只画上+左边线，行末格补右边线、末行补底边线，
            // 避免相邻单元格边框叠加成粗线
            const closeBorders = (style, rightmost, bottommost) => {
                if (rightmost) style += 'border-right:' + B + ';';
                if (bottommost) style += 'border-bottom:' + B + ';';
                return style;
            };

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];

                this._exportHTML += '<tr>';

                if (isTree) {
                    const node = row;
                    for (let j = 0; j < this.arr_filter_vals.length; j++) {
                        const fieldName = this.arr_filter_vals[j];
                        let val;
                        if (j === 0) {
                            const indent = '\u00a0\u00a0\u00a0\u00a0'.repeat(node.level || 0);
                            const hasChildren = node.children && node.children.length > 0;
                            const icon = hasChildren ? '▼' : '';
                            val = indent + icon + (node['tree_nodeName'] || node.key || '');
                        } else {
                            val = node[fieldName];
                            const isNumericField = this._isNumericCell(node, fieldName);
                            if (isNumericField && val != null && !isNaN(val)) {
                                val = this.format_number(val);
                                if (val === 0 || val === '0') val = '-';
                            }
                            if (val == null) val = '';
                        }
                        val = escHtml(this._htmlToText(val));
                        const align = j === 0 ? 'left' : 'center';
                        const rightmost = j === lastCol;
                        const bottommost = i === dataRows.length - 1 && !hasTotalRow;
                        this._exportHTML += '<td style="' + closeBorders(buildCellStyle(row, fieldName), rightmost, bottommost) + 'text-align:' + align + ';">' + val + '</td>';
                    }
                } else {
                    for (let j = 0; j < this.arr_filter_vals.length; j++) {
                        if (coveredCells.has(i + ',' + j)) continue;

                        let attrs = '';
                        const merge = mergeMap.get(i + ',' + j);
                        let cellColspan = 1;
                        if (merge) {
                            if (merge.rowspan > 1) attrs += ' rowspan="' + merge.rowspan + '"';
                            if (merge.colspan > 1) {
                                attrs += ' colspan="' + merge.colspan + '"';
                                cellColspan = merge.colspan;
                            }
                        }

                        const fieldName = this.arr_filter_vals[j];
                        let val = row[fieldName];
                        const isNumericField = this._isNumericCell(row, fieldName);
                        if (isNumericField && val != null && !isNaN(val)) {
                            val = this.format_number(val);
                            if (val === 0 || val === '0') val = '-';
                        }
                        if (val == null) val = '';

                        val = escHtml(this._htmlToText(val));
                        const rightmost = j + cellColspan - 1 === lastCol;
                        const bottommost = i === dataRows.length - 1 && !hasTotalRow;
                        this._exportHTML += '<td' + attrs + ' style="' + closeBorders(buildCellStyle(row, fieldName), rightmost, bottommost) + '">' + val + '</td>';
                    }
                }

                this._exportHTML += '</tr>';
            }

            // 行总计行（与页面 tfoot 一致：浅灰底、加粗、顶部青绿分隔线）
            if (this._rowAlltotalData) {
                this._exportHTML += '<tr>';
                for (let j = 0; j < this.arr_filter_vals.length; j++) {
                    const fieldName = this.arr_filter_vals[j];
                    let val = this._rowAlltotalData[fieldName];
                    const isNumericField = this._isNumericCell(this._rowAlltotalData, fieldName);
                    if (isNumericField && val != null && !isNaN(val)) {
                        val = this.format_number(val);
                        if (val === 0 || val === '0') val = '-';
                    }
                    if (val == null) val = '';
                    val = escHtml(this._htmlToText(val));
                    let gtStyle = 'background:#f0f2f5;color:#333;font-weight:bold;font-family:' + FF + ';font-size:' + FS + ';padding:' + P + ';border-top:1px solid #3a807e;border-left:' + B + ';text-align:center;white-space:nowrap;';
                    gtStyle += isNumericField ? "mso-number-format:'" + numFormat + "';" : "mso-number-format:'\\@';";
                    gtStyle = closeBorders(gtStyle, j === lastCol, true);
                    if (j === 0) gtStyle += 'text-align:left;';
                    this._exportHTML += '<td style="' + gtStyle + '">' + val + '</td>';
                }
                this._exportHTML += '</tr>';
            }

            return this._exportHTML;
        }

        _renderExportHeaderLevel(columns, targetLevel, currentLevel, maxLevel, totalLeaves, leafPos) {
            const B = '1px solid #000000';
            const FF = "'微软雅黑','Microsoft YaHei',Arial,sans-serif";
            const FS = '13px';
            const P = '6px 10px';
            const headStyle = 'background:#c0c4cc;color:#1a1c21;font-weight:bold;font-family:' + FF + ';font-size:' + FS + ';padding:' + P + ';border-top:' + B + ';border-left:' + B + ';text-align:center;white-space:nowrap;vertical-align:middle;';

            for (let col of columns) {
                const span = this._countLeafColumns(col);
                if (currentLevel === targetLevel) {
                    const hasChildren = col.children && col.children.length > 0;
                    let rowspan = 1;
                    if (!hasChildren) {
                        rowspan = maxLevel - currentLevel + 1;
                    }
                    const colspan = span;
                    const rightmost = leafPos.v + span - 1 === totalLeaves - 1;
                    leafPos.v += span;

                    const escHtml = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const title = escHtml(this._htmlToText(col.title || col.field || ''));
                    let attrs = '';
                    if (rowspan > 1) attrs += ' rowspan="' + rowspan + '"';
                    if (colspan > 1) attrs += ' colspan="' + colspan + '"';

                    let style = headStyle;
                    if (rightmost) style += 'border-right:' + B + ';';

                    this._exportHTML += '<td' + attrs + ' style="' + style + '">' + title + '</td>';
                } else if (col.children && col.children.length > 0) {
                    this._renderExportHeaderLevel(col.children, targetLevel, currentLevel + 1, maxLevel, totalLeaves, leafPos);
                } else {
                    // 叶子列被 rowspan 覆盖（如行字段列）：本行不渲染，但需推进列位置
                    leafPos.v += span;
                }
            }
        }

        _countLeafColumns(col) {
            if (!col.children || col.children.length === 0) return 1;
            let count = 0;
            for (let child of col.children) {
                count += this._countLeafColumns(child);
            }
            return count;
        }

        _downloadXLS(bodyHTML) {
            const title = this._htmlToText(this.rpt_des_name) || 'export';
            const escTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            const freeze = this._exportFreezeRows > 0 ? this._exportFreezeRows : 0;
            const freezeXML = freeze > 0
                ? '<x:FreezePanes><x:FrozenNoSplit/><x:SplitHorizontal>' + freeze + '</x:SplitHorizontal><x:TopRowBottomPane>' + freeze + '</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:FreezePanes>'
                : '';

            const fullHTML = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">'
                + '<head><meta charset="utf-8">'
                + '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'
                + '<x:Name>' + escTitle + '</x:Name>'
                + '<x:WorksheetOptions><x:DisplayGridlines/>' + freezeXML + '</x:WorksheetOptions>'
                + '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->'
                + '<style>table {border-collapse:collapse;} td,th {vertical-align:middle;}</style>'
                + '</head><body>'
                + '<table>' + bodyHTML + '</table>'
                + '</body></html>';

            const blob = new Blob(['\uFEFF' + fullHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = (title.replace(/\s+/g, '') || 'export') + '.xls';
            link.click();
            URL.revokeObjectURL(url);
        }

        print() {
            const printWindow = window.open('', '_blank', `width=${screen.width},height=${screen.height}`);
            const title = this.rpt_des_name.replace(/&nbsp;/g, ' ');
            const remark = this.rpt_des_remark.replace(/&nbsp;/g, ' ');

            // 虚拟滚动模式下，生成全量数据HTML而不是使用当前DOM
            let tableHTML;
            if (this._virtualEnabled) {
                tableHTML = this._buildFullTableHTML();
            } else {
                tableHTML = this.$.table.outerHTML;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { margin: 20px; font-family: "微软雅黑",Arial,sans-serif; }
                        .print_title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 6px; }
                        .print_remark { text-align: left; font-size: 12px; color: #666; margin-bottom: 4px; }
                        .print_date { text-align: right; font-size: 12px; color: #666; margin-bottom: 10px; }
                        table { border-collapse: collapse; width: 100%; font-size: 11px; }
                        th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
                        th { background: #eee; font-weight: bold; }
                        .subtotal_row td { font-weight: bold; color: #0b46f5; }
                        .virtual_spacer_top, .virtual_spacer_bottom { display: none; }
                        /* 打印时去掉表头筛选图标（SVG 无样式约束会撑大） */
                        .col_filter_icon { display: none !important; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="print_title">${title}</div>
                    <div class="print_remark">${remark}</div>
                    <div class="print_date">打印时间：${this._formatDate(new Date())}</div>
                    ${tableHTML}
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        /**
         * 生成全量数据表格HTML（用于打印等场景）
         */
        _buildFullTableHTML() {
            const theadHTML = this.$.thead ? this.$.thead.outerHTML : '';
            let bodyHTML = '';

            if (this.elradio_contentType === 'tree') {
                // 树模式：使用全量扁平数据
                const flatNodes = this._flatTreeNodes || [];
                for (let node of flatNodes) {
                    bodyHTML += '<tr data-level="' + node.level + '">';
                    for (let j = 0; j < this.arr_filter_vals.length; j++) {
                        const fieldName = this.arr_filter_vals[j];
                        if (j === 0) {
                            const indent = '\u00a0\u00a0\u00a0\u00a0'.repeat(node.level);
                            const hasChildren = node.children && node.children.length > 0;
                            const icon = hasChildren ? (node._expanded ? '▼' : '▶') : '';
                            bodyHTML += '<td style="text-align:left;">' + indent + icon + (node['tree_nodeName'] || node.key) + '</td>';
                        } else {
                            let val = node[fieldName];
                            const isNumericField = this._isNumericCell(node, fieldName);
                            if (isNumericField && val != null && !isNaN(val)) {
                                val = this.format_number(val);
                                if (val === 0 || val === '0') val = '-';
                            }
                            if (val == null || val === '') val = '-';
                            bodyHTML += '<td>' + val + '</td>';
                        }
                    }
                    bodyHTML += '</tr>';
                }
            } else {
                // Grid模式：使用全量数据
                const dataRows = this.ux_grid_datas || [];

                // 构建合并映射
                const mergeMap = new Map();
                const coveredCells = new Set();
                for (let merge of this.cells_merge) {
                    mergeMap.set(`${merge.row},${merge.col}`, merge);
                    for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
                        for (let c = merge.col; c < merge.col + merge.colspan; c++) {
                            if (r !== merge.row || c !== merge.col) {
                                coveredCells.add(`${r},${c}`);
                            }
                        }
                    }
                }

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    const cls = row.type === 'total' ? ' class="subtotal_row"' : '';
                    bodyHTML += '<tr' + cls + '>';

                    for (let j = 0; j < this.arr_filter_vals.length; j++) {
                        if (coveredCells.has(`${i},${j}`)) continue;

                        let attrs = '';
                        const merge = mergeMap.get(`${i},${j}`);
                        if (merge) {
                            if (merge.rowspan > 1) attrs += ' rowspan="' + merge.rowspan + '"';
                            if (merge.colspan > 1) attrs += ' colspan="' + merge.colspan + '"';
                        }

                        const fieldName = this.arr_filter_vals[j];
                        let val = row[fieldName];
                        const isNumericField = this._isNumericCell(row, fieldName);
                        if (isNumericField && val != null && !isNaN(val)) {
                            val = this.format_number(val);
                            if (val === 0 || val === '0') val = '-';
                        }
                        if (val == null) val = '';

                        bodyHTML += '<td' + attrs + '>' + val + '</td>';
                    }
                    bodyHTML += '</tr>';
                }
            }

            return '<table class="cus_umytable_table" style="border-collapse:collapse;">' + theadHTML + '<tbody>' + bodyHTML + '</tbody></table>';
        }

        _formatDate(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const s = String(date.getSeconds()).padStart(2, '0');
            return `${y}-${m}-${d} ${h}:${min}:${s}`;
        }

        // ==================== 模板管理 ====================
        _loadTemplates() {
            const select = this.container.querySelector('#cus_template_select');
            if (!select) return;

            // 从localStorage加载
            const prefix = this._reportKey;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.indexOf(prefix) > -1) {
                    const tKey = decodeURIComponent(key.replace(prefix, ''));
                    if (tKey && tKey !== '系统默认') {
                        try {
                            const cfg = JSON.parse(decodeURIComponent(localStorage.getItem(key)));
                            if (cfg.report_type) {
                                this.custom_templates.push({ label: tKey, grid_config: cfg });
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            }

            this._updateTemplateSelect();
        }

        _updateTemplateSelect() {
            const select = this.container.querySelector('#cus_template_select');
            if (!select) return;
            select.innerHTML = '<option value="系统默认">系统默认</option>';
            this.custom_templates.forEach(t => {
                if (t.label === '系统默认') return; // 已手动添加，跳过避免重复
                const opt = document.createElement('option');
                opt.value = t.label;
                opt.textContent = t.label;
                select.appendChild(opt);
            });
            select.value = this.sel_templateName;
        }

        _saveTemplate(name) {
            const cfg = this._getGridConfig();
            const prefix = this._reportKey;
            const key = prefix + encodeURIComponent(name);
            localStorage.setItem(key, encodeURIComponent(JSON.stringify(cfg)));

            const idx = this.custom_templates.findIndex(t => t.label === name);
            if (idx >= 0) {
                this.custom_templates[idx].grid_config = cfg;
            } else {
                this.custom_templates.push({ label: name, value: name, grid_config: cfg });
            }
            this.sel_templateName = name;
            this._updateTemplateSelect();
            const lbl = this.container.querySelector('#cus_tpl_label_text');
            if (lbl) lbl.textContent = name;
            // 持久化当前选中的偏好名，刷新后恢复
            localStorage.setItem(prefix + 'sel_templateName', encodeURIComponent(name));
            alert(`偏好【${name}】保存成功!`);
        }

        _deleteTemplate(name) {
            const prefix = this._reportKey;
            const key = prefix + encodeURIComponent(name);
            localStorage.removeItem(key);

            const idx = this.custom_templates.findIndex(t => t.label === name);
            if (idx >= 0) this.custom_templates.splice(idx, 1);

            this.sel_templateName = '系统默认';
            this._updateTemplateSelect();
            const lbl = this.container.querySelector('#cus_tpl_label_text');
            if (lbl) lbl.textContent = '系统默认';
            this._applyTemplate();
            alert(`偏好【${name}】已删除!`);
        }

        // 导出偏好 - 下载当前配置为 JSON
        _exportTemplate() {
            const cfg = this._getGridConfig();
            const exportData = {
                __cus_umytable_template: '1.0',
                name: this.sel_templateName || '系统默认',
                report_name: this.rpt_des_name,
                config: cfg
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cus_umytable_偏好_${this.sel_templateName || '系统默认'}_${this._formatDate(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // 导入偏好
        _importTemplate(data) {
            const cfg = data.config || data;
            if (!cfg || !cfg.report_type) {
                alert('导入失败：配置格式不正确');
                return;
            }
            const name = (data.name || prompt('请输入导入后的偏好名称：', '导入偏好') || '').trim();
            if (!name) return;
            if (name === '系统默认') { alert('不能使用该名称！'); return; }
            // 存到 localStorage 并应用
            const prefix = this._reportKey;
            const key = prefix + encodeURIComponent(name);
            localStorage.setItem(key, encodeURIComponent(JSON.stringify(cfg)));
            const idx = this.custom_templates.findIndex(t => t.label === name);
            if (idx >= 0) this.custom_templates[idx].grid_config = cfg;
            else this.custom_templates.push({ label: name, value: name, grid_config: cfg });
            this.sel_templateName = name;
            this._updateTemplateSelect();
            const lbl = this.container.querySelector('#cus_tpl_label_text');
            if (lbl) lbl.textContent = name;
            localStorage.setItem(prefix + 'sel_templateName', encodeURIComponent(name));
            this._applyTemplate();
            alert(`偏好【${name}】导入成功!`);
        }

        // 条件属性弹窗
        _showReportProps() {
            // 移除旧弹窗
            this._closeModal();
            const mask = document.createElement('div');
            mask.className = 'cus_umytable_modal_mask';
            mask.id = 'cus_props_modal';
            mask.innerHTML = `
                <div class="cus_umytable_modal">
                    <div class="cus_umytable_modal_title">
                        <span>📄 条件属性</span>
                        <span class="modal_close" id="cus_props_close">×</span>
                    </div>
                    <div class="cus_umytable_modal_body">
                        <table>
                            <tr>
                                <th style="width:100px;">报表名称</th>
                                <td><input type="text" id="cus_props_name" value=""></td>
                            </tr>
                            <tr>
                                <th>报表说明</th>
                                <td><input type="text" id="cus_props_remark" value=""></td>
                            </tr>
                            <tr>
                                <th>表类型</th>
                                <td>${this.elradio_tableType === 'summary' ? '汇总' : '明细'}</td>
                            </tr>
                            <tr>
                                <th>表样式</th>
                                <td>${this.elradio_contentType === 'grid' ? '网格' : '树状'}</td>
                            </tr>
                            <tr>
                                <th>行字段</th>
                                <td>${this.rows_fieldList.map(f => f.name).join('、') || '无'}</td>
                            </tr>
                            <tr>
                                <th>列字段</th>
                                <td>${this.cols_fieldList.map(f => f.name).join('、') || '无'}</td>
                            </tr>
                            <tr>
                                <th>数值字段</th>
                                <td>${this.numerics_fieldlist.map(f => f.name).join('、') || '无'}</td>
                            </tr>
                            <tr>
                                <th>数据条数</th>
                                <td>${(this.rsp_datalist || []).length}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="cus_umytable_modal_foot">
                        <button id="cus_props_cancel">取消</button>
                        <button class="primary" id="cus_props_ok">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);
            // 同步当前值
            const nameInput = mask.querySelector('#cus_props_name');
            const remarkInput = mask.querySelector('#cus_props_remark');
            // strip html for editing
            nameInput.value = (this.rpt_des_name || '').replace(/<[^>]+>/g, '');
            remarkInput.value = (this.rpt_des_remark || '').replace(/<[^>]+>/g, '');

            const close = () => this._closeModal();
            mask.querySelector('#cus_props_close').onclick = close;
            mask.querySelector('#cus_props_cancel').onclick = close;
            mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
            mask.querySelector('#cus_props_ok').onclick = () => {
                this.rpt_des_name = nameInput.value.trim();
                this.rpt_des_remark = remarkInput.value.trim();
                this._renderTitle();
                close();
            };
        }

        _closeModal() {
            const m = document.getElementById('cus_props_modal');
            if (m && m.parentNode) m.parentNode.removeChild(m);
            const c = document.getElementById('cus_cond_modal');
            if (c && c.parentNode) c.parentNode.removeChild(c);
        }

        /**
         * 条件属性编辑器（参考 App.vue 的 dialog_conditionFields，但简化且高效）
         * 三栏：字段管理 / 条件列表 / 属性项
         */
        _showConditionEditor() {
            this._closeModal();
            const _this = this;
            // 编辑用临时副本
            this._condEditList = JSON.parse(JSON.stringify(this.conditionFields_list || []));
            this._condSelFieldIdx = this._condEditList.length > 0 ? 0 : -1;
            this._condSelExprIdx = (this._condEditList[0] && (this._condEditList[0].expression_list || []).length > 0) ? 0 : -1;

            const mask = document.createElement('div');
            mask.className = 'cus_umytable_modal_mask';
            mask.id = 'cus_cond_modal';
            mask.innerHTML = `
                <div class="cus_umytable_modal cus_cond_modal">
                    <div class="cus_umytable_modal_title">
                        <span>条件属性配置</span>
                        <span class="modal_close" id="cus_cond_close">×</span>
                    </div>
                    <div class="cus_cond_body">
                        <div class="cus_cond_col">
                            <div class="cus_cond_col_title">字段管理
                                <button class="cus_cond_link" id="cus_cond_field_add">+新增</button>
                                <button class="cus_cond_link" id="cus_cond_field_del">删除</button>
                            </div>
                            <div class="cus_cond_list" id="cus_cond_field_list"></div>
                        </div>
                        <div class="cus_cond_col">
                            <div class="cus_cond_col_title">条件列表
                                <button class="cus_cond_link" id="cus_cond_expr_add">+新增</button>
                                <button class="cus_cond_link" id="cus_cond_expr_del">删除</button>
                            </div>
                            <div class="cus_cond_list" id="cus_cond_expr_list"></div>
                        </div>
                        <div class="cus_cond_col cus_cond_col_wide">
                            <div class="cus_cond_col_title">属性项</div>
                            <div class="cus_cond_props" id="cus_cond_props"></div>
                        </div>
                    </div>
                    <div class="cus_umytable_modal_foot">
                        <button id="cus_cond_cancel">取消</button>
                        <button class="primary" id="cus_cond_ok">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);

            const close = () => { this._closeModal(); };

            const renderFieldList = () => {
                const list = mask.querySelector('#cus_cond_field_list');
                if (this._condSelFieldIdx >= this._condEditList.length) this._condSelFieldIdx = this._condEditList.length - 1;
                list.innerHTML = this._condEditList.map((cf, i) =>
                    `<div class="cus_cond_item ${i === this._condSelFieldIdx ? 'active' : ''}" data-i="${i}">
                        <input type="text" class="cus_cond_field_name" data-i="${i}" value="${this._escapeAttr(cf.label)}" placeholder="字段名">
                    </div>`).join('') || '<div class="cus_cond_empty">（无字段，点「+新增」）</div>';
            };

            const renderExprList = () => {
                const el = mask.querySelector('#cus_cond_expr_list');
                const cf = this._condEditList[this._condSelFieldIdx];
                if (!cf) { el.innerHTML = '<div class="cus_cond_empty">请先选择/新增字段</div>'; return; }
                if (this._condSelExprIdx >= (cf.expression_list || []).length) this._condSelExprIdx = (cf.expression_list || []).length - 1;
                el.innerHTML = (cf.expression_list || []).map((e, i) =>
                    `<div class="cus_cond_item ${i === this._condSelExprIdx ? 'active' : ''}" data-i="${i}">
                        <span class="cus_cond_flag ${e.condition_type === 'if' ? 'flag_if' : 'flag_else'}">${e.condition_type}</span>
                        <input type="text" class="cus_cond_expr_name" data-i="${i}" value="${this._escapeAttr(e.label || '')}" placeholder="条件名">
                    </div>`).join('') || '<div class="cus_cond_empty">（无条件，点「+新增」）</div>';
            };

            const renderProps = () => {
                const el = mask.querySelector('#cus_cond_props');
                const cf = this._condEditList[this._condSelFieldIdx];
                const e = cf && (cf.expression_list || [])[this._condSelExprIdx];
                if (!cf || !e) { el.innerHTML = '<div class="cus_cond_empty">请选择字段和条件</div>'; return; }
                const fontSizes = ['9px','10px','11px','12px','13px','14px','15px','16px','18px','20px','22px','24px','28px','32px','40px','48px'];
                const exprs = (e.expression || []).map((ex, i) => `
                    <div class="cus_cond_expr_row">
                        <input type="text" data-role="key" data-i="${i}" value="${this._escapeAttr(ex.key_exp || '')}" placeholder="cell('字段')" title="值表达式">
                        <button class="cus_cond_link cus_cond_edit_expr" data-edit="key" data-i="${i}">编辑</button>
                        <select data-role="cmp" data-i="${i}">
                            ${['<','<=','>','>=','==','!=','indexOf'].map(c => `<option value="${c}" ${ex.comparison === c ? 'selected' : ''}>${c === 'indexOf' ? '相似' : c}</option>`).join('')}
                        </select>
                        <input type="text" data-role="val" data-i="${i}" value="${this._escapeAttr(ex.value_exp || '')}" placeholder="值表达式" title="值表达式">
                        <button class="cus_cond_link cus_cond_edit_expr" data-edit="val" data-i="${i}">编辑</button>
                        <select data-role="rel" data-i="${i}">
                            <option value="" ${!ex.previous_relation ? 'selected' : ''}></option>
                            <option value="and" ${ex.previous_relation === 'and' ? 'selected' : ''}>与</option>
                            <option value="or" ${ex.previous_relation === 'or' ? 'selected' : ''}>或</option>
                        </select>
                        <button class="cus_cond_link cus_cond_del" data-del-expr="${i}">×</button>
                    </div>`).join('');

                el.innerHTML = `
                    <div class="cus_cond_form_row">
                        <label>条件名称</label>
                        <input type="text" data-role="label" value="${this._escapeAttr(e.label || '')}" placeholder="条件名称">
                    </div>
                    <div class="cus_cond_form_row">
                        <label>条件类型</label>
                        <select data-role="ctype">
                            <option value="if" ${e.condition_type === 'if' ? 'selected' : ''}>if</option>
                            <option value="else" ${e.condition_type === 'else' ? 'selected' : ''}>else</option>
                        </select>
                        <label>是否聚合</label>
                        <select data-role="agg">
                            <option value="false" ${String(e.isAggregate) !== 'true' ? 'selected' : ''}>否</option>
                            <option value="true" ${String(e.isAggregate) === 'true' ? 'selected' : ''}>是</option>
                        </select>
                    </div>
                    <div class="cus_cond_form_row">
                        <label>字体颜色</label>
                        <input type="color" data-role="font_color" value="${this._escapeAttr(e.font_color || '#333333')}" title="字体颜色">
                        <label>背景颜色</label>
                        <input type="color" data-role="bg_color" value="${this._escapeAttr(e.background_color || '#ffffff')}" title="背景颜色">
                        <label>字号</label>
                        <select data-role="font_size">
                            ${fontSizes.map(s => `<option value="${s}" ${e.font_size === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="cus_cond_form_row">
                        <label>值表达式</label>
                        <input type="text" data-role="newValue" value="${this._escapeAttr(e.newValue || '')}" placeholder="sum('金额')/sum('数量')">
                        <button class="cus_cond_link cus_cond_edit_expr" data-edit="newValue">编辑</button>
                    </div>
                    <div class="cus_cond_form_row">
                        <label>链接</label>
                        <input type="text" data-role="linkUrl" value="${this._escapeAttr(e.linkUrl || '')}" placeholder="'http://...?id='+cell('条码')">
                        <button class="cus_cond_link cus_cond_edit_expr" data-edit="linkUrl">编辑</button>
                        <label>跳转</label>
                        <select data-role="linkTarget">
                            <option value="" ${!e.linkTarget ? 'selected' : ''}></option>
                            <option value="_blank" ${e.linkTarget === '_blank' ? 'selected' : ''}>新窗口</option>
                            <option value="_self" ${e.linkTarget === '_self' ? 'selected' : ''}>当前窗口</option>
                            <option value="_open" ${e.linkTarget === '_open' ? 'selected' : ''}>弹出窗口</option>
                        </select>
                    </div>
                    ${e.condition_type === 'if' ? `
                    <div class="cus_cond_expr_rows">
                        <div class="cus_cond_form_row"><label>条件列表</label>
                            <button class="cus_cond_link" id="cus_cond_row_add">+新增</button>
                        </div>
                        ${exprs}
                    </div>` : ''}
                    <div class="cus_cond_form_row">
                        <label>预览</label>
                        <span class="cus_cond_preview" data-role="preview">abcdABCD1234测试</span>
                    </div>
                `;

                // 绑定预览
                const applyPreview = () => {
                    const pv = el.querySelector('[data-role="preview"]');
                    if (!pv) return;
                    const fc = el.querySelector('[data-role="font_color"]').value;
                    const bg = el.querySelector('[data-role="bg_color"]').value;
                    const fs = el.querySelector('[data-role="font_size"]').value;
                    pv.style.color = fc || '#333';
                    pv.style.backgroundColor = bg || 'transparent';
                    pv.style.fontSize = fs || '14px';
                };
                el.querySelector('[data-role="font_color"]').addEventListener('input', applyPreview);
                el.querySelector('[data-role="bg_color"]').addEventListener('input', applyPreview);
                el.querySelector('[data-role="font_size"]').addEventListener('change', applyPreview);
                applyPreview();

                // 值表达式相关输入
                el.querySelectorAll('[data-role="label"], [data-role="ctype"], [data-role="agg"], [data-role="font_color"], [data-role="bg_color"], [data-role="font_size"], [data-role="newValue"], [data-role="linkUrl"], [data-role="linkTarget"]').forEach(inp => {
                    inp.addEventListener('change', () => {
                        const role = inp.getAttribute('data-role');
                        if (role === 'label') { e.label = inp.value; renderExprList(); return; }
                        else if (role === 'ctype') { e.condition_type = inp.value; renderProps(); return; }
                        else if (role === 'agg') e.isAggregate = inp.value;
                        else if (role === 'font_color') e.font_color = inp.value;
                        else if (role === 'bg_color') e.background_color = inp.value;
                        else if (role === 'font_size') e.font_size = inp.value;
                        else if (role === 'newValue') e.newValue = inp.value;
                        else if (role === 'linkUrl') e.linkUrl = inp.value;
                        else if (role === 'linkTarget') e.linkTarget = inp.value;
                    });
                });
                // 值表达式/链接的 text input 也需要 input 事件（change 只在失焦触发）
                el.querySelectorAll('[data-role="newValue"], [data-role="linkUrl"]').forEach(inp => {
                    inp.addEventListener('input', () => {
                        const role = inp.getAttribute('data-role');
                        if (role === 'newValue') e.newValue = inp.value;
                        else if (role === 'linkUrl') e.linkUrl = inp.value;
                    });
                });

                // 表达式编辑按钮
                el.querySelectorAll('.cus_cond_edit_expr').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const edit = btn.getAttribute('data-edit');
                        let cur = '';
                        if (edit === 'newValue') cur = e.newValue;
                        else if (edit === 'linkUrl') cur = e.linkUrl;
                        else {
                            const i = parseInt(btn.getAttribute('data-i'));
                            const ex = (e.expression || [])[i];
                            if (!ex) return;
                            cur = edit === 'key' ? ex.key_exp : ex.value_exp;
                        }
                        this._showExpressionEditor(cur, (text) => {
                            if (edit === 'newValue') e.newValue = text;
                            else if (edit === 'linkUrl') e.linkUrl = text;
                            else {
                                const i = parseInt(btn.getAttribute('data-i'));
                                const ex = (e.expression || [])[i];
                                if (!ex) return;
                                if (edit === 'key') ex.key_exp = text;
                                else ex.value_exp = text;
                            }
                            renderProps();
                        });
                    });
                });

                // 条件行
                el.querySelectorAll('[data-role="key"], [data-role="cmp"], [data-role="val"], [data-role="rel"]').forEach(inp => {
                    inp.addEventListener('change', () => {
                        const i = parseInt(inp.getAttribute('data-i'));
                        const role = inp.getAttribute('data-role');
                        const ex = e.expression[i];
                        if (!ex) return;
                        if (role === 'key') ex.key_exp = inp.value;
                        else if (role === 'cmp') ex.comparison = inp.value;
                        else if (role === 'val') ex.value_exp = inp.value;
                        else if (role === 'rel') ex.previous_relation = inp.value;
                    });
                });
                // 条件行 key/val 的 input 事件
                el.querySelectorAll('[data-role="key"], [data-role="val"]').forEach(inp => {
                    inp.addEventListener('input', () => {
                        const i = parseInt(inp.getAttribute('data-i'));
                        const role = inp.getAttribute('data-role');
                        const ex = e.expression[i];
                        if (!ex) return;
                        if (role === 'key') ex.key_exp = inp.value;
                        else ex.value_exp = inp.value;
                    });
                });
                el.querySelectorAll('[data-del-expr]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        e.expression.splice(parseInt(btn.getAttribute('data-del-expr')), 1);
                        renderProps();
                    });
                });
                const rowAdd = el.querySelector('#cus_cond_row_add');
                if (rowAdd) rowAdd.addEventListener('click', () => {
                    e.expression = e.expression || [];
                    e.expression.push({ id: e.expression.length, key_exp: '', comparison: '==', value_exp: '', previous_relation: '' });
                    renderProps();
                });
            };

            const renderAll = () => { renderFieldList(); renderExprList(); renderProps(); };

            // 字段列表点击（点击 input 时不触发重渲染，避免打断编辑）
            mask.querySelector('#cus_cond_field_list').addEventListener('click', (ev) => {
                if (ev.target.classList.contains('cus_cond_field_name')) return;
                const item = ev.target.closest('.cus_cond_item');
                if (!item) return;
                this._condSelFieldIdx = parseInt(item.getAttribute('data-i'));
                this._condSelExprIdx = 0;
                renderAll();
            });
            // 字段名编辑（实时更新 label，但不重渲染，避免打断输入）
            mask.querySelector('#cus_cond_field_list').addEventListener('input', (ev) => {
                const inp = ev.target.closest('.cus_cond_field_name');
                if (!inp) return;
                const i = parseInt(inp.getAttribute('data-i'));
                this._condEditList[i].label = inp.value;
            });
            // 字段名输入框获取焦点即选中该字段（不重渲染，只更新选中态高亮）
            mask.querySelector('#cus_cond_field_list').addEventListener('focusin', (ev) => {
                const inp = ev.target.closest('.cus_cond_field_name');
                if (!inp) return;
                const item = inp.closest('.cus_cond_item');
                const i = parseInt(item.getAttribute('data-i'));
                if (this._condSelFieldIdx !== i) {
                    this._condSelFieldIdx = i;
                    // 重新渲染字段列表的高亮（不碰正在聚焦的 input 值）
                    const list = mask.querySelector('#cus_cond_field_list');
                    list.querySelectorAll('.cus_cond_item').forEach(it => {
                        it.classList.toggle('active', parseInt(it.getAttribute('data-i')) === i);
                    });
                    // 同步条件列表与属性区
                    this._condSelExprIdx = 0;
                    renderExprList();
                    renderProps();
                }
            });
            // 条件列表点击（点击 input 时不触发重渲染）
            mask.querySelector('#cus_cond_expr_list').addEventListener('click', (ev) => {
                if (ev.target.classList.contains('cus_cond_expr_name')) return;
                const item = ev.target.closest('.cus_cond_item');
                if (!item) return;
                this._condSelExprIdx = parseInt(item.getAttribute('data-i'));
                renderExprList(); renderProps();
            });
            // 条件名编辑
            mask.querySelector('#cus_cond_expr_list').addEventListener('input', (ev) => {
                const inp = ev.target.closest('.cus_cond_expr_name');
                if (!inp) return;
                const i = parseInt(inp.getAttribute('data-i'));
                const cf = this._condEditList[this._condSelFieldIdx];
                cf.expression_list[i].label = inp.value;
            });
            // 条件名输入框获取焦点即选中该条件
            mask.querySelector('#cus_cond_expr_list').addEventListener('focusin', (ev) => {
                const inp = ev.target.closest('.cus_cond_expr_name');
                if (!inp) return;
                const item = inp.closest('.cus_cond_item');
                const i = parseInt(item.getAttribute('data-i'));
                if (this._condSelExprIdx !== i) {
                    this._condSelExprIdx = i;
                    const list = mask.querySelector('#cus_cond_expr_list');
                    list.querySelectorAll('.cus_cond_item').forEach(it => {
                        it.classList.toggle('active', parseInt(it.getAttribute('data-i')) === i);
                    });
                    renderProps();
                }
            });

            // 新增/删除字段
            mask.querySelector('#cus_cond_field_add').addEventListener('click', () => {
                this._condEditList.push({ label: '新字段', index: this._condEditList.length, expression_list: [] });
                this._condSelFieldIdx = this._condEditList.length - 1;
                this._condSelExprIdx = -1;
                renderAll();
            });
            mask.querySelector('#cus_cond_field_del').addEventListener('click', () => {
                if (this._condSelFieldIdx < 0) return;
                this._condEditList.splice(this._condSelFieldIdx, 1);
                this._condSelFieldIdx = this._condEditList.length > 0 ? 0 : -1;
                this._condSelExprIdx = this._condEditList.length > 0 ? 0 : -1;
                renderAll();
            });

            // 新增/删除条件
            mask.querySelector('#cus_cond_expr_add').addEventListener('click', () => {
                const cf = this._condEditList[this._condSelFieldIdx];
                if (!cf) return;
                cf.expression_list = cf.expression_list || [];
                cf.expression_list.push({ label: '条件' + (cf.expression_list.length + 1), condition_type: 'if', isAggregate: 'false', expression: [], background_color: '', font_color: '', font_size: '', newValue: '', linkUrl: '', linkTarget: '' });
                this._condSelExprIdx = cf.expression_list.length - 1;
                renderAll();
            });
            mask.querySelector('#cus_cond_expr_del').addEventListener('click', () => {
                const cf = this._condEditList[this._condSelFieldIdx];
                if (!cf || this._condSelExprIdx < 0) return;
                cf.expression_list.splice(this._condSelExprIdx, 1);
                this._condSelExprIdx = cf.expression_list.length > 0 ? 0 : -1;
                renderAll();
            });

            // 保存/取消
            mask.querySelector('#cus_cond_close').onclick = close;
            mask.querySelector('#cus_cond_cancel').onclick = close;
            mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
            mask.querySelector('#cus_cond_ok').onclick = () => {
                this.conditionFields_list = JSON.parse(JSON.stringify(this._condEditList));
                // 同步条件字段到待选项（新增/改名字段会更新拖拽区字段列表）
                this._syncConditionFieldsToFields();
                this._refreshAll();
                this._syncWindowObject();
                close();
            };

            renderAll();
        }

        /**
         * 函数列表（参考 App.vue function_description_list）
         */
        _getFunctionList() {
            return [
                {
                    label: '运算符',
                    function_item: [
                        { label: '+', value: '+', start_len: 1 }, { label: '-', value: '-', start_len: 1 },
                        { label: '*', value: '*', start_len: 1 }, { label: '/', value: '/', start_len: 1 },
                        { label: '%', value: '%', start_len: 1 }, { label: '(', value: '(', start_len: 1 },
                        { label: ')', value: ')', start_len: 1 }, { label: '()', value: '()', start_len: 1 },
                        { label: "'", value: "'", start_len: 1 }
                    ]
                },
                {
                    label: '数学函数',
                    function_item: [
                        { label: 'abs(x)', value: 'abs()', start_len: 4 },
                        { label: 'random()', value: 'random()', start_len: 7 },
                        { label: 'ceil(x)', value: 'ceil()', start_len: 5 },
                        { label: 'floor(x)', value: 'floor()', start_len: 6 },
                        { label: 'round(x,y)', value: 'round(,)', start_len: 6 },
                        { label: 'pow(x,y)', value: 'pow(,)', start_len: 4 }
                    ]
                },
                {
                    label: '字符串函数',
                    function_item: [
                        { label: "length('x')", value: 'length()', start_len: 7 },
                        { label: "indexOf('x','y')", value: 'indexOf(,)', start_len: 8 },
                        { label: "includes('x','y')", value: 'includes(,)', start_len: 9 },
                        { label: "replace('x','y','z')", value: 'replace(,,)', start_len: 8 },
                        { label: "substring('x',start,end)", value: 'substring(,,)', start_len: 10 },
                        { label: "trim('x')", value: 'trim()', start_len: 5 },
                        { label: "toLowerCase('x')", value: 'toLowerCase()', start_len: 12 },
                        { label: "toUpperCase('x')", value: 'toUpperCase()', start_len: 12 },
                        { label: "param('x')", value: 'param()', start_len: 6 }
                    ]
                },
                {
                    label: '日期函数',
                    function_item: [
                        { label: 'getdate()', value: 'getdate()', start_len: 9 },
                        { label: 'dateadd()', value: 'dateadd(,,)', start_len: 8 },
                        { label: 'datediff()', value: 'datediff(,,)', start_len: 9 },
                        { label: 'dateformat()', value: 'dateformat(,)', start_len: 11 },
                        { label: 'datename()', value: 'datename(,)', start_len: 9 }
                    ]
                }
            ];
        }

        /**
         * 表达式编辑弹窗（参考 App.vue dialog_functionDescription）
         * 左：字段列表（双击插入 cell/sum 公式）；右：textarea；底部：函数列表（双击插入）
         * 确认后回写到 callback(text)
         */
        _showExpressionEditor(initialText, onOk) {
            this._closeExprEditor();
            const self = this;
            const mask = document.createElement('div');
            mask.className = 'cus_umytable_modal_mask';
            mask.id = 'cus_expr_modal';

            // 字段列表：数值字段用 sum()，其余用 cell()
            const fieldItems = [];
            for (const nf of this.numerics_fieldlist) {
                fieldItems.push({ label: "sum('" + nf.name + "')", value: "sum('" + nf.name + "')" });
            }
            const allFields = [...this.rows_fieldList, ...this.cols_fieldList, ...this.numerics_fieldlist, ...this.hide_fieldslist];
            const seen = new Set();
            for (const f of allFields) {
                if (seen.has(f.name)) continue;
                seen.add(f.name);
                fieldItems.push({ label: "cell('" + f.name + "')", value: "cell('" + f.name + "')" });
            }

            const fieldHtml = fieldItems.map(it =>
                `<div class="cus_expr_field" data-v="${this._escapeAttr(it.value)}" title="双击插入 ${this._escapeAttr(it.label)}">${this._escapeAttr(it.label)}</div>`
            ).join('');

            const funcHtml = this._getFunctionList().map(group => `
                <div class="cus_expr_func_group">
                    <span class="cus_expr_func_group_title">${this._escapeAttr(group.label)}:</span>
                    <div class="cus_expr_func_items">
                        ${group.function_item.map(f => `<span class="cus_expr_func_item" data-v="${this._escapeAttr(f.value)}" data-len="${f.start_len}" title="${this._escapeAttr(f.label)}">${this._escapeAttr(f.label)}</span>`).join('')}
                    </div>
                </div>`).join('');

            mask.innerHTML = `
                <div class="cus_umytable_modal cus_expr_modal">
                    <div class="cus_umytable_modal_title">
                        <span>表达式编辑</span>
                        <span class="modal_close" id="cus_expr_close">×</span>
                    </div>
                    <div class="cus_expr_body">
                        <div class="cus_expr_left">
                            <div class="cus_expr_sec_title">字段列表</div>
                            <div class="cus_expr_field_list">${fieldHtml}</div>
                        </div>
                        <div class="cus_expr_right">
                            <div class="cus_expr_sec_title">表达式编辑</div>
                            <textarea id="cus_expr_textarea" spellcheck="false" placeholder="请输入表达式,如cell('xxx')+'ABC'....">${this._escapeHtml(initialText || '')}</textarea>
                            <div class="cus_expr_funcs">${funcHtml}</div>
                        </div>
                    </div>
                    <div class="cus_umytable_modal_foot">
                        <button id="cus_expr_cancel">取消</button>
                        <button class="primary" id="cus_expr_ok">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);

            const textarea = mask.querySelector('#cus_expr_textarea');
            const insertAt = (text, startLen) => {
                const s = textarea.selectionStart || textarea.value.length;
                const e = textarea.selectionEnd || textarea.value.length;
                textarea.value = textarea.value.slice(0, s) + text + textarea.value.slice(e);
                const caret = s + text.length - (startLen != null ? startLen : 0);
                textarea.focus();
                textarea.setSelectionRange(caret, caret);
            };

            // 字段双击插入
            mask.querySelectorAll('.cus_expr_field').forEach(el => {
                el.addEventListener('dblclick', () => insertAt(el.getAttribute('data-v'), 0));
            });
            // 函数双击插入
            mask.querySelectorAll('.cus_expr_func_item').forEach(el => {
                el.addEventListener('dblclick', () => {
                    const v = el.getAttribute('data-v');
                    const len = parseInt(el.getAttribute('data-len')) || 0;
                    insertAt(v, v.length - len);
                });
            });

            const close = () => { this._closeExprEditor(); };
            mask.querySelector('#cus_expr_close').onclick = close;
            mask.querySelector('#cus_expr_cancel').onclick = close;
            mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
            mask.querySelector('#cus_expr_ok').onclick = () => {
                if (onOk) onOk(textarea.value);
                close();
            };
        }

        _closeExprEditor() {
            const m = document.getElementById('cus_expr_modal');
            if (m && m.parentNode) m.parentNode.removeChild(m);
        }

        _escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        _applyTemplate() {
            // 选择「系统默认」时，重置回报表原始配置
            if (this.sel_templateName === '系统默认') {
                this._resetToDefault();
                return;
            }
            const template = this.custom_templates.find(t => t.label === this.sel_templateName);
            if (!template || !template.grid_config) {
                this._resetToDefault();
                return;
            }
            const cfg = template.grid_config;
            this.report_type = cfg.report_type || 'summary';
            this.elradio_tableType = cfg.report_type || 'summary';
            this.elradio_contentType = cfg.elradio_contentType || 'grid';
            this.expandTreelevel = cfg.expandTreelevel || 1;
            this.elradio_autoFrozenCols = cfg.elradio_autoFrozenCols || 'false';
            this.frozenCols = cfg.frozenCols || 1;
            this.elradio_isShow_ColSubtotal = cfg.elradio_isShow_ColSubtotal || 'false';
            this.elradio_isShow_ColAlltotal = cfg.elradio_isShow_ColAlltotal || 'false';
            this.elradio_rowSubtotalStyle = cfg.elradio_rowSubtotalStyle || 'simple';
            this.enableMergeData = cfg.enableMergeData || 'true';
            this.ipt_rowSubtotal_numberColumns = cfg.ipt_rowSubtotal_numberColumns || 0;
            this.orderby_fields = cfg.orderby_fields || {};
            this.elradio_separator = cfg.elradio_separator || 'false';
            this.ipt_decimalPlaces = cfg.ipt_decimalPlaces || 2;
            this.filter_fieldlist = cfg.filter_fieldlist || {};
            if (cfg.rows_fieldList) this.rows_fieldList = JSON.parse(JSON.stringify(cfg.rows_fieldList));
            if (cfg.cols_fieldList) this.cols_fieldList = JSON.parse(JSON.stringify(cfg.cols_fieldList));
            if (cfg.numerics_fieldlist) this.numerics_fieldlist = JSON.parse(JSON.stringify(cfg.numerics_fieldlist));
            if (cfg.hide_fieldslist) this.hide_fieldslist = JSON.parse(JSON.stringify(cfg.hide_fieldslist));
            if (cfg.conditionFields_list) this.conditionFields_list = JSON.parse(JSON.stringify(cfg.conditionFields_list));
            if (cfg.size_style) {
                this.size_style = cfg.size_style;
                this.elradio_size = cfg.size_style;
                this.$.wrapper.className = `cus_umytable_wrapper size_${cfg.size_style}`;
            }
            this.isShow_frozenCols = cfg.isShow_frozenCols || false;
            this.isShow_treelevel = cfg.isShow_treelevel || false;
            // 恢复自定义列宽（深拷贝避免与模板对象互相影响），并同步持久化槽位
            this.columnWidths = JSON.parse(JSON.stringify(cfg.columnWidths || {}));
            this._saveColumnWidths();

            this._syncUIFromConfig();
            this._refreshAll();
            this.setCookie('sel_templateName', encodeURIComponent(this.sel_templateName));
        }

        /**
         * 重置回报表原始配置（对应「系统默认」）
         */
        _resetToDefault() {
            const ri = this.reportinfo || {};
            this.report_type = ri.rpt_cfg_type || 'summary';
            this.elradio_tableType = this.report_type;
            this.elradio_contentType = ri.rpt_cfg_contentType || 'grid';
            this.expandTreelevel = ri.rpt_cfg_expandTreelevel || 1;
            this.elradio_autoFrozenCols = this._mapBoolean(ri.rpt_cfg_autoFrozenCols, 'false');
            this.isShow_frozenCols = this.elradio_autoFrozenCols === 'true';
            this.frozenCols = ri.rpt_cfg_frozenCols || 1;
            this.elradio_isShow_ColSubtotal = this._mapBoolean(ri.rpt_cfg_ShowColSubtotal, 'false');
            this.elradio_isShow_ColAlltotal = this._mapBoolean(ri.rpt_cfg_ShowColAlltotal, 'false');
            this.elradio_rowSubtotalStyle = ri.rpt_cfg_rowSubtotal_style || 'simple';
            this.enableMergeData = this._mapBoolean(ri.rpt_cfg_enableMergeData, 'true');
            this.ipt_rowSubtotal_numberColumns = parseInt(ri.rpt_cfg_rowSubtotal_numberColumns) || 0;
            this.orderby_fields = ri.rpt_cfg_orderby_fields || {};
            this.elradio_separator = this._mapBoolean(ri.rpt_cfg_separator, 'false');
            this.ipt_decimalPlaces = parseInt(ri.rpt_cfg_decimalPlaces) || 2;
            this.filter_fieldlist = ri.rpt_cfg_filterlist || {};
            this.conditionFields_list = ri.conditionFields_list || [];
            this.size_style = this.options.size || 'small';
            this.elradio_size = this.size_style;
            this.columnWidths = {};
            this._saveColumnWidths();
            this.isShow_treelevel = this.elradio_contentType === 'tree';

            // 重新从原始字段配置初始化字段列表
            this._initFields();
            this._syncConditionFieldsToFields();

            this.sel_templateName = '系统默认';
            if (this.$.wrapper) this.$.wrapper.className = `cus_umytable_wrapper size_${this.size_style}`;
            this._syncUIFromConfig();
            this._refreshAll();
            this.setCookie('sel_templateName', encodeURIComponent('系统默认'));
        }

        _getGridConfig() {
            return {
                report_type: this.report_type,
                elradio_contentType: this.elradio_contentType,
                expandTreelevel: this.expandTreelevel,
                elradio_autoFrozenCols: this.elradio_autoFrozenCols,
                frozenCols: this.frozenCols,
                rows_fieldList: JSON.parse(JSON.stringify(this.rows_fieldList)),
                cols_fieldList: JSON.parse(JSON.stringify(this.cols_fieldList)),
                numerics_fieldlist: JSON.parse(JSON.stringify(this.numerics_fieldlist)),
                hide_fieldslist: JSON.parse(JSON.stringify(this.hide_fieldslist)),
                size_style: this.size_style,
                isShow_frozenCols: this.isShow_frozenCols,
                isShow_treelevel: this.isShow_treelevel,
                elradio_isShow_ColSubtotal: this.elradio_isShow_ColSubtotal,
                elradio_isShow_ColAlltotal: this.elradio_isShow_ColAlltotal,
                elradio_rowSubtotalStyle: this.elradio_rowSubtotalStyle,
                enableMergeData: this.enableMergeData,
                ipt_rowSubtotal_numberColumns: this.ipt_rowSubtotal_numberColumns,
                orderby_fields: JSON.parse(JSON.stringify(this.orderby_fields)),
                elradio_separator: this.elradio_separator,
                ipt_decimalPlaces: this.ipt_decimalPlaces,
                filter_fieldlist: JSON.parse(JSON.stringify(this.filter_fieldlist)),
                columnWidths: JSON.parse(JSON.stringify(this.columnWidths)),
                conditionFields_list: JSON.parse(JSON.stringify(this.conditionFields_list || []))
            };
        }

        setCookie(name, value) {
            localStorage.setItem(this._reportKey + name, value);
        }

        getCookie(name) {
            return localStorage.getItem(this._reportKey + name);
        }

        // ==================== UI辅助 ====================
        _showLoading() {
            const loader = this.$.loading;
            if (loader) loader.classList.add('show');
        }

        _hideLoading() {
            const loader = this.$.loading;
            if (loader) loader.classList.remove('show');
        }

        _updateTableHeight() {
            const wrapper = this.$.tableWrapper;
            if (wrapper) {
                wrapper.style.maxHeight = (window.innerHeight - 320) + 'px';
            }
        }

        // ==================== 公共API ====================
        /** 重新加载数据 */
        reload(url) {
            this.options.dataUrl = url;
            this.loadData(url);
        }

        /** 获取当前配置 */
        getConfig() {
            return this._getGridConfig();
        }

        /** 设置配置并刷新 */
        setConfig(config) {
            Object.assign(this, config);
            this._syncUIFromConfig();
            this._refreshAll();
        }

        /** 刷新表格 */
        refresh() {
            this._refreshAll();
        }

        /** 销毁实例 */
        destroy() {
            this.container.innerHTML = '';
        }
    }

    // 暴露到全局
    global.CusUmyTable = CusUmyTable;

    // 静态创建方法
    CusUmyTable.create = function(container, options) {
        return new CusUmyTable(container, options);
    };

})(window);
