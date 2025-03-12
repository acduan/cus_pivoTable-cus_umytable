 
<template>
    <div :style="{width:(proWidth-2)+'px',padding:'1px'}">
    <!-- <div> -->
        <div class="drag_row head_tools">
                   <el-link slot="reference" class="head_tools_link"  @click="print_event" id="btn_print"  > 
                        <i class="el-icon-printer" ></i>
                        <span style="margin-left: 0px;">打印</span>
                   </el-link>
            
                    <el-link slot="reference" class="head_tools_link"  @click="export_event"
                        > 
                        <i class="el-icon-download" ></i>
                        <span style="margin-left: 0px;">导出excel</span>
                   </el-link>

                   
                    <el-link slot="reference"  @click="handle_isshowDrag" class="head_tools_link" >
                        <i class="el-icon-setting" ></i>
                        <span style="margin-left: 0px;"> {{ btn_setingname }}</span>
                    </el-link>
                  

                <el-dropdown @command="handle_templateItemChange" class="head_tools_link" style="cursor: pointer;">
                    <span class="el-dropdown-link">
                     <i class="el-icon-view"></i>    {{sel_templateName}}<i class="el-icon-arrow-down el-icon--right"></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item :key="item.label" v-for="item in custom_templates" :command="item.label">{{ item.label }}</el-dropdown-item>
                    </el-dropdown-menu>
                    </el-dropdown>

            <!-- </div> -->

                

            <div v-show="sel_divIsShow" id="elementsContainer" class="cls_tempSelList">
                        <div  class="cls_tempSelList_body">
                            <div v-show="elradio_tableType=='summary'?true:false" >
                                    <el-button slot="reference" type="text" :disabled=" orderby_fields[sel_tagtext]=='asc'?true:false "  @click="handle_orderby_fields('asc')"
                                     > 
                                            <i class="el-icon-top" ></i>
                                            <span  class="cls_tempSelList_body_sortlink">组内正序</span>
                                    </el-button>

                                    <el-button slot="reference" type="text" :disabled=" orderby_fields[sel_tagtext]=='desc'?true:false " @click="handle_orderby_fields('desc')"
                                    > 
                                            <i class="el-icon-bottom" ></i>
                                            <span class="cls_tempSelList_body_sortlink">组内倒序</span>
                                    </el-button>

                                    <el-button slot="reference" type="text"  :disabled=" orderby_fields[sel_tagtext]==undefined?true:false "  @click="handle_reset_orderby()"> 
                                            <span class="cls_tempSelList_body_sortlink">重置排序</span>
                                    </el-button>
                            </div>
                            <input type="text" class="cls_filter_input" style="margin-right: 5px;"
                                @input="handle_inputchangeValue" v-model="sel_iptSearch">
                            <el-checkbox :indeterminate="sel_isIndeterminate"
                                @change="handle_checkAllChange">全选</el-checkbox>
                            <div style="max-height: 180px; overflow: auto;">
                                <el-checkbox style="width: calc( 100% - 30px )"
                                    v-for="item in this.sel_columns[this.sel_colIndex].filters" :label="item.label"
                                    v-model="item.checked" :key="item.label" @change="handle_selChangeItem">
                                    {{ item.label }}

                                </el-checkbox>
                            </div>
                        </div>
                        <div class="cls_tempSelList_foot" >
                            <el-button class="cls_tempSelList_foot_btnlink"   type="text" :disabled="sel_btn_qy_disabled"
                                :size="size_style" @click="handle_filterValue">筛选</el-button>
                            <el-button class="cls_tempSelList_foot_btnlink" type="text" :disabled="sel_btn_reset_disabled" :size="size_style"
                                @click="handle_resetvalue">重置</el-button>
                        </div>
                    </div>
        </div>

        <el-collapse-transition>
            <div id="drag_box" v-show="isShow_drag" class="cls_drag_plan" >

                <div class="drag_row">
                    <span class="drag_span">操作项:</span>
                    <el-link @click="handle_conditionFields_show" slot="reference"  class="cls_dragrow_btnlink" >
                        <i class="el-icon-set-up"></i> 
                        <span style="margin-left: 1px;">条件属性</span> 
                     </el-link>

                    <div  class="cls_dragrow_btnSplitLine"></div>

                        <el-popover placement="bottom" title="" width="260" trigger="hover"    >
                            <div  class="cls_dragrow_template_tip">tip:<br>1.自定义偏好保存至本地缓存,请勿在浏览器设置中清理该地址的缓存<br>2.如要修改自定义偏好，输入相同名称</div>
                            <el-input v-model="ipt_templateName" placeholder="请输入需要保存或修改的“自定义偏好”名称" size="mini" class="cls_dragrow_template_input" ></el-input>
                            <el-link icon="el-icon-edit-outline" class="cls_dragrow_template_btnlink_ok"
                                @click="handle_click_saveTemplate">保存自定义</el-link>
                                <el-link icon="el-icon-delete"  class="cls_dragrow_template_btnlink_del"
                                @click="handle_delTemplateClick">删除选中项</el-link>
                            &nbsp;&nbsp;
                        

                                <el-link  slot="reference"
                                class="cls_dragrow_btnlink"><i class="el-icon-edit"></i> <span style="margin-left: 1px;">保存偏好</span>
                                    </el-link>
                        </el-popover>

                    <div  class="cls_dragrow_btnSplitLine"></div>
                    
                    <el-link @click="handle_exportConfig" slot="reference"  class="cls_dragrow_btnlink" >
                        <i class="el-icon-download"></i> 
                        <span style="margin-left: 1px;">导出偏好</span> 
                     </el-link>
                     <div  class="cls_dragrow_btnSplitLine"></div>

                     <el-link @click="handle_importConfig" slot="reference"  class="cls_dragrow_btnlink" >
                        <i class="el-icon-upload2"></i> 
                        <span style="margin-left: 1px;">导入偏好</span> 
                     </el-link>
                    
                </div>

                <div class="drag_row">
                    <span class="drag_span">表类型:</span>
                    <el-radio-group v-model="elradio_tableType" @change="handle_radiochange_tableType" :size="size_style"
                         class="cls_dragrow_btnlink_first" >
                        <el-radio label="summary">汇总</el-radio>
                        <el-radio label="detail">明细</el-radio>
                    </el-radio-group>

                    <div class="cls_dragrow_btnSplitLine"></div>


                    <span class="drag_span">表样式:</span>
                    <el-radio-group v-model="elradio_contentType" @change="handle_radiochange_contentType"
                        :size="size_style" class="cls_dragrow_btnlink_first">
                        <el-radio label="grid">网格</el-radio>
                        <el-radio label="tree">树状</el-radio>
                    </el-radio-group>

                    <div v-show="isShow_treelevel">
                        <span class="drag_span cls_dragrow_span_expandTreelevel" >展开级数:</span>
                        <el-input-number v-model="expandTreelevel" :min="1" :max="100" :step="1" size="mini"
                            class="cls_dragrow_input_number_tree"  @change="handle_iptChange_treeLevel"></el-input-number>
                    </div>
                    
                </div>

                <div class="drag_row">
                      <div > 
                        <div style="float: left;">
                        <span class="drag_span cls_dragrow_span_ColSubtotal" >列小计:</span>
                        <el-radio-group v-model="elradio_isShow_ColSubtotal" @change="handle_radiochange_isShowColSubtotal" :size="size_style"
                           class="cls_dragrow_btnlink_first" >
                            <el-radio label="true">显示</el-radio>
                            <el-radio label="false">隐藏</el-radio>
                        </el-radio-group>
                        <!-- <div class="cls_dragrow_btnSplitLine"> </div> -->
                        
                      </div>

                        <div  style="float: left;">
                            <span class="drag_span cls_dragrow_span_ColSubtotal" >列总计:</span>
                            <el-radio-group v-model="elradio_isShow_ColAlltotal" @change="handle_radiochange_isShow_ColAlltotal" :size="size_style"
                            class="cls_dragrow_btnlink_first" >
                                <el-radio label="true">显示</el-radio>
                                <el-radio label="false">隐藏</el-radio>
                            </el-radio-group>
                            <div class="cls_dragrow_btnSplitLine_right"  ></div>
                        </div>
                    </div>

                 

                        <span class="drag_span cls_dragrow_span_expandTreelevel" >合并至几列:</span>
                        <el-input-number v-model="ipt_rowSubtotal_numberColumns" :min="0" :max="rowSubtotal_numberColumns_max" :step="1" size="mini"
                           class="cls_dragrow_input_number"  @change="handle_ipt_rowSubtotal_numberColumns"></el-input-number>
                            <div  class="cls_dragrow_btnSplitLine"></div>

                    <div style="float: left;">
                        <span class="drag_span cls_dragrow_span_ColSubtotal"  >行小计:</span>
                        <el-radio-group v-model="elradio_rowSubtotalStyle" @change="handle_radiochange_rowSubtotalStyle" :size="size_style"
                            class="cls_dragrow_btnlink_first" >
                            <el-radio label="default">常规</el-radio>
                            <el-radio label="simple">精简</el-radio>
                            <el-radio label="none">无行小计</el-radio>
                        </el-radio-group>
                       </div>
                </div>

                <div class="drag_row">
                    <span class="drag_span">字大小:</span>
                    <el-radio-group size="mini" v-model="elradio_size"  class="cls_dragrow_btnlink_first"
                        @change="handle_sizeChange">
                        <el-radio-button label="medium">大号</el-radio-button>
                        <el-radio-button label="small">中号</el-radio-button>
                        <el-radio-button label="mini">小号</el-radio-button>
                    </el-radio-group>

                    <div class="cls_dragrow_btnSplitLine"></div>

                    <span class="drag_span">千分位:</span>
                    <el-radio-group v-model="elradio_separator" @change="handle_radiochange_separator"
                        :size="size_style"  class="cls_dragrow_btnlink_first">
                        <el-radio label="true">显示</el-radio>
                        <el-radio label="false">隐藏</el-radio>
                    </el-radio-group>

                    <div class="cls_dragrow_btnSplitLine" ></div>


                    <span class="drag_span cls_dragrow_span_expandTreelevel"  >小数保留位:</span>
                        <el-input-number v-model="ipt_decimalPlaces" :min="0" :max="8" :step="1" size="mini"
                           class="cls_dragrow_input_number"  @change="handle_iptChange_decimalPlaces"></el-input-number>


                            <div class="cls_dragrow_btnSplitLine"></div>

                    <span class="drag_span">列冻结:</span>
                    <el-radio-group v-model="elradio_autoFrozenCols" @change="handle_radiochange_autoFrozenCols"
                        :size="size_style"  class="cls_dragrow_btnlink_first" >
                        <el-radio label="true">启用</el-radio>
                        <el-radio label="false">关闭</el-radio>
                    </el-radio-group>
                    <div v-show="isShow_frozenCols">
                        <span class="drag_span cls_dragrow_span_expandTreelevel" >冻结列数:</span>
                        <el-input-number v-model="frozenCols" :step="1" :min="1"
                            :max="this.elradio_contentType == 'tree' ? 1 : this.rows_fieldList.length" size="mini"
                             class="cls_dragrow_input_number"
                            @change="handle_iptChange_frozenCols"></el-input-number>
                    </div>

                </div>

                <div class="drag_row">
                    <span class="drag_span">数据行:</span>
                    <draggable class="drag_doms" v-model="rows_fieldList" group="fields_group"  
                        @add="handle_darg_add" @update="handle_darg_update">
                        <transition-group class="drag_listgroup">
                            <el-tag class="cls_eltag" :class="conditionFields_list.map(ite=>ite.label).includes(element.name)?'cls_isConditionField':''" :size="size_style" 
                                v-for="element in rows_fieldList" :key="element.order" closable @close="handle_rowsTagClose(element.name)">
                                {{ element.name }}
                                &nbsp;&nbsp;
                                <i   @click="handle_Tagclick(element.name, 'row')"
                                    class="el-icon-arrow-down cls_dragrow_i_black"></i>
                            </el-tag>

                        </transition-group>
                    </draggable>
                </div>

                <div class="drag_row">
                    <span class="drag_span">数据列:</span>
                    <draggable class="drag_doms" v-model="cols_fieldList" group="fields_group"  
                        @add="handle_darg_add" @update="handle_darg_update">
                        <transition-group class="drag_listgroup">

                            <el-tag class="cls_eltag" :class="conditionFields_list.map(ite=>ite.label).includes(element.name)?'cls_isConditionField':''" :size="size_style" :key="element.order"
                                v-for="element in cols_fieldList" closable @close="handle_colsTagClose(element.name)">
                                {{ element.name }}
                                &nbsp;&nbsp;
                                <i   @click="handle_Tagclick(element.name, 'col')"
                                    class="el-icon-arrow-down cls_dragrow_i_black"></i>

                            </el-tag>
                        </transition-group>
                    </draggable>
                   
                </div>

                <div class="drag_row">
                    <span class="drag_span">数值项:</span>
                    <draggable class="drag_doms" v-model="numerics_fieldlist" group="fields_group"
                          @add="handle_darg_add" @update="handle_darg_update">
                        <transition-group class="drag_listgroup">

                            <el-tag class="cls_eltag" :class="conditionFields_list.map(ite=>ite.label).includes(element.name)?'cls_isConditionField':''"  :size="size_style" type="success" :key="element.order"
                                v-for="element in numerics_fieldlist" closable :disable-transitions="false"
                                @close="handle_numericsTagClose(element.name)">
                                {{ element.name }}
                                <i   @click="handle_Tagclick(element.name, 'row')"
                                    class="el-icon-arrow-down cls_dragrow_i_black"></i>
                            </el-tag>
                        </transition-group>
                    </draggable>
                </div>

                <div class="drag_row">
                    <span class="drag_span" @click="handle_hidelableclick" >待选项:</span>
                    <draggable class="drag_doms"   v-model="hide_fieldslist" group="fields_group"  
                        @add="handle_darg_add" @start="isDragging = true" @end="isDragging = false">
                        <transition-group class="drag_listgroup">
                            <el-tag class="cls_eltag1 cls_dragrow_eltag1_hidefields" :class="conditionFields_list.map(ite=>ite.label).includes(element.name)?'cls_isConditionField':''"  :size="size_style" :key="element.order"  
                                v-for="element in hide_fieldslist" :disable-transitions="false">
                                {{ element.name }}
                            </el-tag>
                        </transition-group>
                    </draggable>
                </div>

                

            </div>
        </el-collapse-transition>
        <div class="drag_row drag_row_div_desname" >
            <div id="div_des_name" v-html="this.rpt_des_name"></div>
        </div>
        <div class="drag_row drag_row_div_desremark" >
             <div id="div_des_remark" class="drag_row_div_desremark_text"  v-html="this.rpt_des_remark" ></div>
        </div>
        

        <ux-grid  class="cls_uxgrid_summary" ref="plxTable" id="ux_gridtable" :max-height="proHeight" show-overflow
            :show-summary="showSummary" :widthResize="true" :size="size_style" :summary-method="handle_summary"
            :row-class-name="row_className" 
            :cell-class-name="cell_className" 
            :columns="ux_grid_columns" 
            :merge-cells="cells_merge" :tree-config="ux_grid_treeConfig" @row-dblclick="handle_rowDBClick" use-virtual
            show-header-overflow="ellipsis">
        </ux-grid>

        <el-dialog :title="detailTable_title" :visible.sync="dialog_detailTable" width="98%" top="5%" class="dialog_box1" >
            <el-button type="primary" size="mini" class="cls_dialog_detailTable_button"  @click="export_event_detail"><i
                    class="el-icon-download">导出excel</i></el-button>
           <ux-grid  class="cls_uxgrid_detail" ref="plxTable_detail" show-overflow :max-height="proHeight_detail"
                stripe
                :show-summary="showSummary" :widthResize="true" :size="size_style" :summary-method="handle_summary_detail"
                :columns="ux_grid_columns_detail"
                use-virtual
                showBodyOverflow="title"
                showHeaderOverflow="title"
                show-header-overflow="ellipsis">
            </ux-grid>
        </el-dialog>

        <el-dialog title="详情" :visible.sync="dialog_TargetWindow" width="98%" top="3%"   class="dialog_box1" >
            <iframe :src="iframe_linkUrl" frameborder="0"  style="height: 75vh;width:100%" ></iframe>
        </el-dialog>


        <el-dialog title="条件属性配置" :visible.sync="dialog_conditionFields" width="98%" @closed="handle_closed_conditionlist" top="5%" class="dialog_box1" >
                <!-- <div style="width: 100%; border-top: 1px solid #000;"> -->
                <!-- </div> -->

            <div class="div_body cls_onditions_div_body" >

                <div class="body_left cls_onditions_div_leftbody_top">
                    <el-divider content-position="left" >
                        字段管理
                    </el-divider>
                    <div class="left_top" >
                        &nbsp;&nbsp;<el-link type="" @click="handle_conditionFields_add"> 新增</el-link>&nbsp;&nbsp;
                        <el-link type="" @click="handle_conditionFields_update"> 修改</el-link>&nbsp;&nbsp;
                        <el-link type="danger" @click="handle_conditionFields_delete" > 删除</el-link>&nbsp;&nbsp;
                     </div>
                     

                    <div class="left_body cls_onditions_div_leftbody_body" >
                        <el-menu
                        default-active="2"
                        class="el-menu-vertical-demo" >
                            <el-menu-item   v-for="item in conditionFields_list_temp" :index="item.label" :key="item.label"  @click="handle_conditionFields_select(item.label)"
                             class="cls_onditions_div_leftbody_body_fields" >
                                <span slot="title">
                                    {{item.label}} 
                                </span>
                            </el-menu-item>
                        </el-menu>
                    </div>

                </div>


                <div class="body_center cls_onditions_div_leftbody_top cls_onditions_div_centerbody"  >

                    <el-divider content-position="left" >
                        条件配置
                    </el-divider>
                    <div class="left_top" >
                        &nbsp;&nbsp;<el-link type="" @click="handle_expressionlist_add" > 新增</el-link>&nbsp;&nbsp;
                        <el-link type="danger" @click="handle_expressionlist_delete">删除</el-link>&nbsp;&nbsp;
                     </div>

                    <div class="left_body cls_onditions_div_centerbody_body">
                        <el-menu
                        default-active="2"
                        class="el-menu-vertical-demo" >
                            <el-menu-item   v-for="item in sel_conditionFields_obj.expression_list" :key="item.label"  :index="item.label" 
                            @click="handle_expression_select(item.label)" 
                            class="cls_onditions_div_centerbody_expresslist"
                             >
                                <span slot="title">
                                    <span  class="cls_andflag" :class="item.condition_type=='if'?'':'cls_orflag' " >
                                        {{item.condition_type}}
                                    </span> 
                                    &nbsp;&nbsp;{{item.label}}
                                </span>
                            </el-menu-item>
                        </el-menu>
                    </div>

                     

                </div>

                <div class="body_right cls_onditions_div_rightbody"  >
                    <el-divider content-position="left" >
                        属性项
                    </el-divider>
                    <div class="left_top" >
                        &nbsp;&nbsp;<el-link type="" @click="handle_expression_obj_clear" > 清空</el-link>&nbsp;&nbsp;
                     </div>

                    <div class="left_body cls_onditions_div_centerbody_body" >
                         
                        <el-form :model="sel_expression_obj" ref="form_expression_obj" :rules="rules" label-width="80px">
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item label="条件名称:">
                                        <el-input class="cls_onditions_div_rightbody_input" v-model="sel_expression_obj.label" placeholder="请输入条件名称"></el-input>
                                    </el-form-item>
                                </el-col>

                                <el-col :span="12">
                                    <el-form-item label="条件类型:">
                                        <el-select class="cls_onditions_div_rightbody_input" v-model="sel_expression_obj.condition_type" placeholder="请选择条件类型">
                                            <el-option label="if" value="if"></el-option>
                                            <el-option label="else" value="else"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>


                            <el-row>
                                <el-col :span="3">
                                    <el-form-item label="字体颜色:">
                                        <el-color-picker v-model="sel_expression_obj.font_color" ></el-color-picker>
                                    </el-form-item>
                                </el-col>

                                <el-col :span="3">
                                    <el-form-item label="背景颜色:">
                                        <el-color-picker v-model="sel_expression_obj.background_color" ></el-color-picker>
                                    </el-form-item>
                                </el-col>

                                <el-col :span="6">
                                    <el-form-item label="字体大小:">
                                        <el-select v-model="sel_expression_obj.font_size" class="cls_onditions_div_rightbody_select" filterable clearable placeholder="请选择字体大小">
                                                <el-option v-for="n in 22" :key="n"  :label="(n+8)+'px'" :value="(n+8)+'px'" > </el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>

                                <el-col :span="12">
                                    <el-form-item label="预览样式:">
                                        <div class="cls_onditions_div_rightbody_prview" :style="{color:sel_expression_obj.font_color,backgroundColor:sel_expression_obj.background_color,fontSize:sel_expression_obj.font_size}" >abcdABCD1234测试</div>
                                    </el-form-item>
                                </el-col>
                            </el-row>

                            <el-row>
                                <el-col :span="12">
                                    <el-form-item label="是否聚合:">
                                        <el-select v-model="sel_expression_obj.isAggregate" class="cls_onditions_div_rightbody_select"  filterable clearable placeholder="是否聚合字段">
                                            <el-option label="否" value="false"></el-option>
                                            <el-option label="是" value="true"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="值表达式:" prop="newValue" >
                                        <div>
                                        <el-input
                                            clearable 
                                            filterable 
                                            class="cls_onditions_div_rightbody_input_newValue"
                                            placeholder="cell('字段1')+'xxx'"
                                            v-model="sel_expression_obj.newValue">
                                        </el-input>
                                        <el-link type="primary"  icon="el-icon-edit-outline"  @click="handle_expression_newValue_edit" >编辑值</el-link>
                                    </div>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item label="链接:" prop="linkUrl" >
                                        <div>
                                        <el-input
                                            clearable 
                                            filterable 
                                            class="cls_onditions_div_rightbody_input_newValue"
                                            style="width: 99%;"
                                            placeholder="'http://127.0.0.1:8000?par1='+cell('字段1')"
                                            v-model="sel_expression_obj.linkUrl">
                                        </el-input>
                                    </div>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="2">
                                        <el-link type="primary"    icon="el-icon-edit-outline"  @click="handle_expression_linkUrl_edit" >编辑值</el-link>
                                </el-col>

                                <el-col :span="8">
                                    <el-form-item label="跳转方式:">
                                        <el-select v-model="sel_expression_obj.linkTarget" class="cls_onditions_div_rightbody_select"  filterable clearable placeholder="跳转方式">
                                            <el-option label="弹出窗口" value="_open"></el-option>
                                            <el-option label="新窗口" value="_blank"></el-option>
                                            <el-option label="当前窗口" value="_self"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                           

                            <div class="left_top" >
                            </div>

                            <div v-show="sel_expression_obj.condition_type=='if'?true:false ">

                                <el-form-item label="条件列表">
                                    <el-link type="primary" @click="handle_expression_insert" >新增</el-link>
                                </el-form-item>

                                <div class="cls_onditions_div_rightbody_expresslist"  >
                                    <el-row   v-for="(item,index) in sel_expression_obj.expression" :key="item.id" >
                                            <el-col :span="7">
                                                <el-form-item label="值表达式" :prop="'expression.' + index + '.key_exp'" :rules="rules.key_exp" >
                                                    <el-input v-model="item.key_exp"  class="cls_onditions_div_rightbody_expresslist_key" clearable filterable  placeholder="cell('字段1')+'xxx'">
                                                    </el-input>
                                                    <el-link type="primary" @click="handle_expression_value_edit(item.id,'key_exp')"  icon="el-icon-edit-outline"  ></el-link>
                                                </el-form-item>
                                            </el-col>
                                            <el-col :span="4">
                                                <!-- <div style="height:21px">&nbsp;</div> -->
                                                <el-select v-model="item.comparison" class="cls_onditions_div_rightbody_expresslist_comparison" filterable clearable placeholder="请选择比较符">
                                                    <el-option label="小于" value="<"></el-option>
                                                    <el-option label="小于等于" value="<="></el-option>
                                                    <el-option label="大于" value=">"></el-option>
                                                    <el-option label="大于等于" value=">="></el-option>
                                                    <el-option label="等于" value="=="></el-option>
                                                    <el-option label="不等于" value="!="></el-option>
                                                    <el-option label="相似" value="indexOf"></el-option>
                                                </el-select>
                                            </el-col>
                                            <el-col :span="7">
                                                <el-form-item label="值表达式" :prop="'expression.' + index + '.value_exp'" :rules="rules.value_exp" >
                                                    <el-input v-model="item.value_exp" class="cls_onditions_div_rightbody_expresslist_value"  clearable placeholder="cell('字段1')+'xxx'"></el-input>
                                                    <el-link type="primary" @click="handle_expression_value_edit(item.id,'value_exp')"  icon="el-icon-edit-outline"  ></el-link>
                                                </el-form-item>
                                            </el-col>
                                            <el-col :span="4">
                                                <!-- <div style="height:21px">&nbsp;</div> -->
                                                <el-select v-model="item.previous_relation" class="cls_onditions_div_rightbody_expresslist_relation" filterable clearable placeholder="与上一条件关系">
                                                    <el-option label="与" value="and"></el-option>
                                                    <el-option label="或" value="or"></el-option>
                                                </el-select>
                                            </el-col> 
                                            <el-col :span="2" class="cls_onditions_div_rightbody_expresslist_btn_del">
                                                <!-- <div style="height:21px">&nbsp;</div> -->
                                                <el-link type="danger" @click="handle_expression_obj_delete(item.id)" >删除</el-link> 
                                            </el-col>
                                        </el-row>
                                    </div>
                            </div>
                        </el-form>

                    </div>

                </div>

            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="this.dialog_conditionFields=false; ">取 消</el-button>
                <el-button type="primary" @click="handle_save_conditionlist('form_expression_obj')">保存</el-button>
            </div>
        </el-dialog>

        <el-dialog
            title="表达式编辑"
            :visible.sync="dialog_functionDescription"
            width="60%"  top="5%" class="dialog_box1"
           >
            
           <div class="cls_functionDescription_plan">
                <div class="div_left cls_functionDescription_plan_left"  >
                    <el-divider content-position="left" >
                        字段列表
                    </el-divider>
                    

                    <div class="cls_functionDescription_plan_left_list">
                        <div v-for="item in expression_Fields_list" :key="item.index"  @dblclick="handle_fields_dbclick(item.value)"   class="text item">
                           
                                <el-tooltip  class="item cls_functionDescription_plan_left_list_item" effect="dark"    :content="'双击插入'+item.label+'公式'" placement="right">
                                    <el-button  class="cls_functionDescription_plan_left_list_item_button"  size="mini"   >
                                        {{item.label}}
                                    </el-button>
                                </el-tooltip>
                            
                        </div>
                    </div>
                    
                </div>
                <div class="div_right cls_functionDescription_plan_right" >
                    <el-divider content-position="left" >
                        表达式编辑
                    </el-divider>
                    <textarea class='ipt_area cls_functionDescription_plan_right_textarea' spellcheck="false" v-model="ipt_textarea_expression" placeholder="请输入表达式,如cell('xxx')+'ABC'.... " name="message"  >
                    </textarea>
                </div>
                <div class="div_bottom cls_functionDescription_plan_bottom"  >

                    <div class="cls_functionDescription_plan_bottom_list" v-for="item in function_description_list" :key="item.label"   >
                        <div class="cls_functionDescription_plan_bottom_list_div">
                            <span class="title cls_functionDescription_plan_bottom_list_div_title"  >
                                {{item.label}}:&nbsp;&nbsp;
                            </span>
                            <div  v-for="funname in item.function_item" :key="funname.label" @dblclick="handle_fields_dbclick(funname.value,funname.start_len)"  class="cls_functionDescription_plan_bottom_list_div_item" >
                                <el-tooltip  class="item cls_functionDescription_plan_bottom_list_div_tip" effect="dark"    :content="funname.tip_text" placement="top">
                                    <el-button :key="funname.label" size="mini"  >{{funname.label}}</el-button>
                                </el-tooltip>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
            
            

            <span slot="footer" class="dialog-footer">
                <el-button @click="dialog_functionDescription = false">取 消</el-button>
                <el-button type="primary" @click="handle_dialog_Description_ok">确 定</el-button>
            </span>
         </el-dialog>

 


    </div>


</template>

<script>

//auther:qmx-duanZhongLin
//自定义精简透视表格
if(window.dom_width==undefined){
    window.dom_width=window.innerWidth;
}
if(window.dom_height==undefined){
    window.dom_height=window.innerHeight;
}

import Vue from 'vue';
import UmyUi from 'umy-ui'
import 'umy-ui/lib/theme-chalk/index.css';

import { Button, Checkbox, Tag,Divider, Icon, Radio, RadioGroup, Loading, RadioButton,ColorPicker, InputNumber,Menu,MenuItem, Link, Message, MessageBox, Input, Popover,Dialog,Dropdown ,DropdownMenu,DropdownItem,Select,Form,FormItem,Row,Col,Option,Tooltip} from 'element-ui'
import CollapseTransition from 'element-ui/lib/transitions/collapse-transition';
import draggable from 'vuedraggable';
import { exportJsonToExcel} from 'pl-export-excel'
// import pinyin from 'js-pinyin';

import 'element-ui/lib/theme-chalk/loading.css';
import 'element-ui/lib/theme-chalk/radio.css';
import 'element-ui/lib/theme-chalk/base.css';
import 'element-ui/lib/theme-chalk/radio-button.css';
// import { ElLink } from 'element-ui/types/link';
// import { ElLink } from 'element-ui/types/link';



// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

 
Vue.use(Button); 
Vue.use(Checkbox);
Vue.use(Tag);
Vue.use(Icon);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Loading);
Vue.use(RadioButton);
Vue.use(InputNumber)
Vue.use(Link);
Vue.use(Input);
Vue.use(Dialog);
Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);
Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(ColorPicker);
Vue.use(Divider);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Select);
Vue.use(Option);

Vue.use(Row);
Vue.use(Col);
Vue.use(Tooltip)


Vue.component(CollapseTransition.name, CollapseTransition)
Vue.use(UmyUi);
Vue.use(Popover);


export default {
    components: {
    draggable,
    // ElLink
},
    data() {
        return {
            tableData: [],
            btn_setingname: '自定义',
            size_style: 'small',
            elradio_size: 'small',
            size_height: 0,
            elbtn_type: "primary",
            isShow_drag: false,
            isShow_ColSubtotal:false,
            rpt_des_name: '',
            elradio_tableType: "summary",
            elradio_isShow_ColSubtotal:"false",
            elradio_isShow_ColAlltotal:"false",
            elradio_rowSubtotalStyle:"simple",
            ipt_rowSubtotal_numberColumns:0,
            orderby_fields:{},
            rowSubtotal_numberColumns_max:0,
            elradio_contentType: 'grid',
            elradio_separator:"false",
            ipt_decimalPlaces:2,
            proWidth: window.dom_width,
            proHeight: window.dom_height-123,
            rsp_jsonData: {},
            rsp_datalist: [],
            rsp_datalist_original: [],
            rsp_datalist_initial: [],
            mergedDataMap:new Map(),
            showSummary: true,
            timeinfo: [],
            cells_merge: [],
            ux_grid_columns: [],
            ux_grid_datas: [],
            ux_grid_header: [],
            hide_fieldslist: [],
            rows_fieldList: [],
            cols_fieldList: [],
            numerics_fieldlist: [],
            groupNumerics_fieldlist: [],
            groupNumerics_list: [],
            maxheight: true,
            filter_fieldlist: {},
            arr_filter_vals: [],
            report_descriptlist: [],
            report_descriptinfo: {},
            report_type: '',
            tempComponent: null,
            sel_isclick: true,
            rpt_des_remark:"",
            sel_colIndex: 0,
            sel_tagtext:"",
            sel_columns: [{
                label: "",
                title: "",
                filters: [
                    {
                        label: '',
                        value: '',
                        checked: false,
                    }
                ]
            }],
            custom_templates: [{
                label: '系统默认',
                value: '系统默认',
                checked: true,
            }
            ],
            sel_templateName: '',
            sel_isIndeterminate: false,
            sel_tagtextIndex: 0,
            sel_divIsShow: false,
            sel_btn_qy_disabled: false,
            sel_iptSearch:"",
            sel_btn_reset_disabled: false,
            ux_grid_treeData: [],
            ux_grid_treeData2: [],

            ux_grid_treeConfig: null,
            expandTreelevel: 1,
            expandTreeNodes: [],
            isShow_treelevel: false,
            isShow_frozenCols: false,
            elradio_autoFrozenCols: "false",
            frozenCols: 1,
            ipt_templateName: '',
            ColumnValues: {},
            dialog_detailTable:false,
            dialog_conditionFields:false,
            dialog_functionDescription:false,
     
            ux_grid_columns_detail:[],
            detailTable_title:"详情",
            proHeight_detail:600,
            sel_conditionField_index:0,
            sel_expression_index:0,
            
            conditionFields_execute:[],
            conditionFields_list_temp:[],
            conditionFields_list:[ 
            ],
            sel_conditionFields_obj:{
            },
            sel_expression_obj:{
            },
            expression_Fields_list:[],
            ipt_textarea_expression:"",
            dialog_TargetWindow:false,
            iframe_linkUrl:"",
            clickCount:0,
            "function_description_list":[{
                    "label": "运算符",
                    "function_item": [{
                        "label": "+",
                        "value": "+",
                        "keyword": "+",
                        "tip_text": "加号运算"
                    }, {
                        "label": "-",
                        "value": "-",
                        "keyword": "-",
                        "tip_text": "减号运算"
                    }, {
                        "label": "*",
                        "value": "*",
                        "keyword": "*",
                        "tip_text": "乘号运算"
                    }, {
                        "label": "/",
                        "value": "/",
                        "keyword": "/",
                        "tip_text": "除号运算"
                    }, {
                        "label": "%",
                        "value": "%",
                        "keyword": "%",
                        "tip_text": "取模运算,如:5%2的结果为1"
                    }, {
                        "label": "(",
                        "value": "(",
                        "keyword": "(",
                        "tip_text": "左括号"
                    }, {
                        "label": ")",
                        "value": ")",
                        "keyword": ")",
                        "tip_text": "右括号"
                    }, {
                        "label": "()",
                        "value": "()",
                        "keyword": "()",
                        "tip_text": "括号",
                        "start_len": 1
                    }, {
                        "label": "'",
                        "value": "'",
                        "keyword": "'",
                        "tip_text": "单引号"
                    }]
                }, {
                    "label": "数学函数",
                    "function_item": [{
                        "label": "abs(x)",
                        "value": "abs()",
                        "keyword": "abs",
                        "tip_text": "返回 x 的绝对值,如:abs(-10)的结果为10",
                        "start_len": 4
                    }, {
                        "label": "random()",
                        "value": "random()",
                        "keyword": "random",
                        "tip_text": "返回一个[0, 1)区间内的随机浮点数,如:random()的结果为0.5141569021947727",
                        "start_len": 7
                    }, {
                        "label": "ceil(x)",
                        "value": "ceil()",
                        "keyword": "ceil",
                        "tip_text": "返回大于或等于 x 的最小整数,如:ceil(1.2)的结果为2",
                        "start_len": 5
                    }, {
                        "label": "floor(x)",
                        "value": "floor()",
                        "keyword": "floor",
                        "tip_text": "返回小于或等于 x 的最大整数,如:floor(1.5)的结果为1",
                        "start_len": 6
                    }, {
                        "label": "round(x,y)",
                        "value": "round(,)",
                        "keyword": "round",
                        "tip_text": "round函数会根据标准的四舍五入规则进行保留小数位数,如:round(12.2355,2)的结果为12.24",
                        "start_len": 6
                    }, {
                        "label": "pow(x,y)",
                        "value": "pow(,)",
                        "keyword": "pow",
                        "tip_text": "返回 x 的 y 次幂,如:pow(2,3)的结果为8",
                        "start_len": 4
                    }]
                }, {
                    "label": "字符串函数",
                    "function_item": [{
                        "label": "length('x')",
                        "value": "length()",
                        "keyword": "length",
                        "tip_text": "返回字符串的长度,如:length('abc')的结果为3",
                        "start_len": 7
                    }, {
                        "label": "indexOf('x','y')",
                        "value": "indexOf(,)",
                        "keyword": "indexOf",
                        "tip_text": "返回指定值首次出现的位置,如果未找到则返回-1,如:indexOf('abc','b')的结果为1",
                        "start_len": 8
                    }, {
                        "label": "includes('x','y')",
                        "value": "includes(,)",
                        "keyword": "includes",
                        "tip_text": "检查字符串是否包含指定的子字符串,返回布尔值,如:includes('abc','b')的结果为true",
                        "start_len": 9
                    }, {
                        "label": "replace('x','y','z')",
                        "value": "replace(,,)",
                        "keyword": "replace",
                        "tip_text": "替换字符串中的指定值,返回新的字符串,如:replace('abc','b','-')的结果为'a-c'",
                        "start_len": 8
                    }, {
                        "label": "substring('x',start,end)",
                        "value": "substring(,,)",
                        "keyword": "substring",
                        "tip_text": "提取字符串的一部分并返回新的字符串,如:substring('abc',1,3)的结果为'bc'",
                        "start_len": 10
                    }, {
                        "label": "trim('x')",
                        "value": "trim()",
                        "keyword": "trim",
                        "tip_text": "去除字符串两端的空白字符,如:trim(' ab c ')的结果为'ab c'",
                        "start_len": 5
                    }, {
                        "label": "toLowerCase('x')",
                        "value": "toLowerCase()",
                        "keyword": "toLowerCase",
                        "tip_text": "将字符串转换为小写,如:toLowerCase('ABC')的结果为'abc'",
                        "start_len": 12
                    }, {
                        "label": "toUpperCase('x')",
                        "value": "toUpperCase()",
                        "keyword": "toUpperCase",
                        "tip_text": "将字符串转换为大写,如:toUpperCase('abc')的结果为'ABC'",
                        "start_len": 12
                    }]
                }, {
                    "label": "日期函数",
                    "function_item": [{
                        "label": "getdate()",
                        "value": "getdate()",
                        "keyword": "getdate",
                        "tip_text": "返回当前日期/时间,如:getdate()的结果为yyyy-MM-dd HH:mm:ss格式的当前时间"
                    }, {
                        "label": "dateadd()",
                        "value": "dateadd(,,)",
                        "keyword": "dateadd",
                        "tip_text": "返回指定日期/时间的加减,如:dateadd('dd',-2,'2024-01-03')的结果为2024-01-01",
                        "start_len": 8
                    }, {
                        "label": "datediff()",
                        "value": "datediff(,,)",
                        "keyword": "datediff",
                        "tip_text": "返回两个日期/时间的差值,如:datediff('dd','2023-01-01','2024-01-01')的结果365",
                        "start_len": 9
                    }, {
                        "label": "dateformat()",
                        "value": "dateformat(,)",
                        "keyword": "dateformat",
                        "tip_text": "返回两个日期/时间的差值,如:dateformat('2024-01-01 12:00:00','yyyy-MM')的结果'2024-01'",
                        "start_len": 11
                    }, {
                        "label": "datename()",
                        "value": "datename(,)",
                        "keyword": "datename",
                        "tip_text": "返回日期/时间的指定部分的字符字符串,如:datename('year', '2024-01-01')的结果为'2024',datename('week', '2024-01-01')的结果为'星期一'",
                        "start_len": 9
                    }]
                }],
               
                rules: {
                    newValue: [
                        { validator: this.validIsScript, trigger: 'change' },
                    ],
                    linkUrl: [
                        { validator: this.validIsScript, trigger: 'change' },
                    ],
                    key_exp: [
                        { validator: this.validIsScript, trigger: 'change' },
                    ],
                    value_exp: [
                        { validator: this.validIsScript, trigger: 'change' },
                    ],
                }


        };
    },
    created() {
    },
    computed: {
    },
    watch: {},
    mounted() {
        this.rsp_jsonData = require("./components/report_data2.json");
        window.addEventListener('resize', this.fun_debounce(this.handle_sizeChange,500));
        setTimeout(() => {
            this.handle_sizeChange();
        }, 500);
        this.load_rptParams();
    },
    beforeDestroy() {
        // 移除 resize 事件监听器
        window.removeEventListener('resize', this.handle_sizeChange);
    },
  

    methods: {
        fun_debounce(func, wait) {
            let timeout; 
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },
        validIsScript (rule, value, callback)  {
            var istrue=true;
            try {
                istrue=this.isExecutableScript(value);
                callback();
            } catch (e) {
                callback(new Error(e));
            }
        },
        initFieldsParam() {
            let _this = this;
            let index = 0;
            if (_this.reportinfo.rpt_des_hideFields) {
                _this.hide_fieldslist = _this.reportinfo.rpt_des_hideFields.split(',').map((name) => {
                    return { name, order: index++};
                });
            }
            else {
                _this.hide_fieldslist = [];
            }
            const arr_numerics = _this.reportinfo.rpt_des_numericFields.split(',');
            if (_this.reportinfo.rpt_des_rowFields) {
                var arr_rows = _this.reportinfo.rpt_des_rowFields.split(',');
                if (_this.report_type == 'summary') {
                    arr_rows = arr_rows.filter(val => !arr_numerics.includes(val));
                }
                _this.rows_fieldList = arr_rows.map((name) => {
                    return { name, order: index++ };
                });
            }
            else {
                _this.rows_fieldList = [];
            }
            if (_this.reportinfo.rpt_des_colFields) {
                _this.cols_fieldList = _this.reportinfo.rpt_des_colFields.split(',').map((name) => {
                    return { name, order: index++ };
                });
            }
            else {
                _this.cols_fieldList = [];
            }
            if (_this.reportinfo.rpt_des_numericFields) {
                _this.numerics_fieldlist = arr_numerics.map((name) => {
                    return { name, order: index++ };
                });
            }
            else {
                _this.numerics_fieldlist = [];
            }
        },

        print_event(){
            let loading = this.$loading({
                lock: true,
                text: '数据加载中,请稍等...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.3)',
                color: "#000",
            });
            let str_rowshtml= this.export_html_summary();
            let str_tablehtml=`<table border=1 style="border-collapse:collapse;">${str_rowshtml}</table>`;
            var screenWidth = screen.width;
            var screenHeight = screen.height;
            // 创建新的窗口
            let printWindow = window.open('', '', `height=${screenHeight},width=${screenWidth}`);
            printWindow.document.body.margin='0px';
            printWindow.document.body.innerHTML = str_tablehtml;
            printWindow.print();
            printWindow.onafterprint = function() {
                 printWindow.close();
            };
             printWindow.close();

            setTimeout(() => {
                loading.close();
            }, 500);
        }
        ,
        export_event() {
            let loading = this.$loading({
                lock: true,
                text: '数据导出中,请稍等...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.3)',
                color: "#000",
            })

            this.export_Excel_summary();
            loading.close();
            setTimeout(() => {
                loading.close();
            }, 8000);
        },
        export_event_detail(){
            let loading = this.$loading({
                lock: true,
                text: '数据导出中,请稍等...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.3)',
                color: "#000",
            })
            setTimeout(() => {
                this.export_Excel_detail();
                loading.close();
            }, 200);

            setTimeout(() => {
                loading.close();
            }, 8000);
        }
     ,export_Excel_detail(){
             let _this=this;
             let table_data = [];
             let df_CellStyle = {
                font: {
                    name: "微软雅黑", sz: 9, color: { auto: 1 },
                },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                }
            };
             let printTableTitle=document.getElementById('div_des_name').innerText.trim()+'>>'+ _this.detailTable_title;
             let table_head_columns=   ([..._this.rows_fieldList,..._this.cols_fieldList,..._this.hide_fieldslist,..._this.numerics_fieldlist]).map(ite=>ite.name)
             //let table_head_columns= Object.keys(table_data[0]);
             let table_title=table_head_columns.map((item,idx)=>{ return idx==0?printTableTitle:'' });
             let table_export_date=table_head_columns.map((item,idx)=>{ 
                if(idx== table_head_columns.length-1){
                    return '导出时间：'+ dateformat(getdate(),'yyyy-MM-dd HH:mm:ss') ;
                }
                else if(idx==0) { 
                    return document.getElementById('div_des_remark').innerText.trim(); 
                } else {
                    return "" 
                } 
             });
             table_data=table_data.map(item=>{ 
                    let values=[]; 
                    Object.keys(item).forEach(keyname=>{ 
                        if(keyname!='_XID'){
                            values.push( item[keyname] ) ;
                         }
                    }); 
                    return values ;
                })
             table_data.unshift(table_head_columns);
             table_data.unshift(table_export_date);
             table_data.unshift(table_title);


            let datalist=  _this.$refs.plxTable_detail.getTableData().fullData
            for(let item of datalist ){
                let datarow=[];
                for(let col_name of table_head_columns){
                    datarow.push(item[col_name]);
                }
                table_data.push(datarow);
            }

             let cols_length=table_head_columns.length-1
             let cell_merges=[];
             let head_title_merge={
                s: {
                    c: 0,
                    r:0
                },
                e: {
                    c: cols_length,
                    r: 0
                }
             }
             let head_date_merge={
                s: {
                    c: 0,
                    r:1
                },
                e: {
                    c: 1,
                    r: 1
                }
             }
             
             
             let arr_ExcelColumnName=_this.getExcelColumnName(cols_length+1);
             cell_merges.push(head_title_merge);
             cell_merges.push(head_date_merge);

             exportJsonToExcel({
                data: table_data,
                merges: cell_merges,
				 styleFun: function (ws) {

                    Object.keys(ws).forEach((cell_name) => {
                        let rowindex= cell_name.split(/\D+/).filter(Boolean).toString();

                        if (!cell_name.includes('!') && rowindex!=2) {
                            ws[cell_name].s = df_CellStyle;
                        }
                    })
                 
                    ws['!cols'][0].wch=ws['!cols'][0].wch/2.5;
                    ws['!cols'][cols_length].wch=ws['!cols'][cols_length].wch/2
                    ws['A1'].s = {
                        font: {
                            name: "微软雅黑",bold:true, sz: 13, color: { auto: 1 },
                        }
                        ,border: {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        },
                        alignment: {
							vertical: "center",
                            horizontal: "center",
                        }
                    };
                    ws[arr_ExcelColumnName[cols_length]+'2'].s  = {
                        font: {
                            name: "微软雅黑", sz: 9, color: { auto: 1 },
                        }
                        ,border: {
                            right: { style: 'thin' }
                        },
                        alignment: {
							vertical: "center",
                            horizontal: "right",
                        }
                    };

                    ws['A2'].s = {
                        font: {
                            name: "微软雅黑", sz: 9, color: { auto: 1 },
                        }
                        ,border: {
                            left: { style: 'thin' },
                        },
                        alignment: {
							vertical: "center",
                            horizontal: "left",
                        }
                    };
                },
                filename: printTableTitle.replace(/\s+/g,''),
                bookType: 'xlsx',
                //autoWidth: true,
            });
        },
  
        export_Excel_summary() {
            let _this = this ;
            let table_data=[];
            this.cell_style_list=[];
            let printTableTitle=document.getElementById('div_des_name').innerText.trim();
            let table_head_columns=_this.arr_filter_vals;
            let table_title=table_head_columns.map((item,idx)=>{ return idx==0?printTableTitle:'' });
            let table_export_date=table_head_columns.map((item,idx)=>{ 
                if(idx== 0){
                    return '导出时间：'+dateformat(getdate(),'yyyy-MM-dd HH:mm:ss');
                }
                else {
                    return "" 
                } 
             });

             let table_export_remark=table_head_columns.map((item,idx)=>{ 
               if(idx==0) { 
                    return document.getElementById('div_des_remark').innerText.trim(); 
                } else {
                    return "" 
                } 
             });
            table_data.push(table_title);
            table_data.push(table_export_remark);
            table_data.push(table_export_date);

            let cols_length=table_head_columns.length-1
            let cell_merges=[];
            let head_title_merge={
                s: {
                    c: 0,
                    r:0
                },
                e: {
                    c: cols_length,
                    r: 0
                }
             }
             let export_date_merge={
                s: {
                    c: 0,
                    r:1
                },
                e: {
                    c: cols_length,
                    r: 1
                }
             }
             let export_date_remark={
                s: {
                    c: 0,
                    r:2
                },
                e: {
                    c: cols_length,
                    r: 2
                }
             }
             cell_merges.push(head_title_merge);
             cell_merges.push(export_date_merge);
             cell_merges.push(export_date_remark);

             let head_rowTitle=[];
             let maxlevel=_this.cols_fieldList.length==0?1:_this.cols_fieldList.length;
             if(_this.report_type!='summary'){
                maxlevel=0;
             }

             let fun_getColumn_vals= ( col_item ,col_index)=>{
                    let maxNodeCount=0;
                    let fun_getMaxNodeCount=(tempNode)=>{
                        if(tempNode.children!=undefined){
                            //在倒数第二级时，求和所有子级的个数
                            if( tempNode.children[0]!=undefined && tempNode.children[0].children==undefined){
                                maxNodeCount = maxNodeCount +  tempNode.children.length;
                            }
                            for(let tempitem of tempNode.children){
                                fun_getMaxNodeCount(tempitem);
                            }
                        } 
                    }
                   
                    fun_getMaxNodeCount(col_item);
                    maxNodeCount=maxNodeCount==0?1:maxNodeCount;
                    let rowindex=col_item.level;
                    for(let i=1;i<=maxNodeCount;i++){
                        if(head_rowTitle[rowindex]==undefined){
                            head_rowTitle[rowindex]=[];
                        }
                        for(let j=0;j<col_index;j++){
                            if(head_rowTitle[rowindex][j]==undefined){
                                head_rowTitle[rowindex][j]=''
                            }
                        }
                        if(i==1){
                            head_rowTitle[rowindex].push(col_item.title);
                        }
                        else{
                            head_rowTitle[rowindex].push("");
                        }
                    }

                    if(col_item.level!=maxlevel && col_item.name!='虚拟node' ){
                        let rowspan=col_item.children!=undefined && col_item.children[0]!=undefined && col_item.children[0].name=='虚拟node'?maxlevel-col_item.level:0
                        let colspan=maxNodeCount;
                        let col_merge={
                            s: {
                                c: head_rowTitle[rowindex].length-colspan,
                                r:table_data.length+col_item.level
                            },
                            e: {
                                c: head_rowTitle[rowindex].length-1,
                                r: table_data.length+col_item.level+rowspan
                            }
                        }
                        cell_merges.push(col_merge);
                    }
             };

             let fun_getNodes=(tempNode,col_index)=>{
                if(tempNode.children==undefined && tempNode.level!=maxlevel){
                    tempNode.children=[{ name:'虚拟node', title:'',level:tempNode.level+1 }]
                }
                if(tempNode.children!=undefined){
                    for(let tempitem of tempNode.children){
                        fun_getNodes(tempitem,col_index);
                    }
                }
                fun_getColumn_vals(tempNode,col_index);
            }

            for(let i=0;i<_this.ux_grid_columns.length;i++){
                let col_item=_this.ux_grid_columns[i];
                let col_index=i;
                fun_getNodes(col_item,col_index);
            }

            table_data=[...table_data,...head_rowTitle];
            
            for (let item of _this.cells_merge) {
                cell_merges.push({
                    s: {
                        c: item.col,
                        r: item.row + table_data.length
                    },
                    e: {
                        c: item.colspan + item.col - 1,
                        r: item.row + item.rowspan + table_data.length-1
                    }
                });
            } 
            let df_CellStyle = {
                font: {
                    name: "微软雅黑", sz: 9, color: { auto: 1 },
                },
                fill: { 
                    fgColor: { rgb: 'FFFFFF'}, 
                },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                }
            };

            let df_CellStyle_tree = {
                font: {
                    name: "微软雅黑", sz: 9, color: { auto: 1 },
                },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                },
                fill: { 
                    fgColor: { rgb: 'FFFFFF'}, 
                },
                alignment: {
                    horizontal: "left",
                    vertical: "center",
                }
            };
            let table_grid = this.$refs.plxTable.getTableData();
            let datalist = [];
            let arr_numericFields=_this.groupNumerics_list.map(ite=>ite.cname);
            arr_numericFields=[...arr_numericFields,...(_this.numerics_fieldlist.map(ite=>ite.name))  ]
            if(this.cell_style_list==undefined){
                this.cell_style_list={body_startIndex:table_data.length};
            }
            if(_this.elradio_contentType=='tree'){
                let rowindex=table_data.length+1;
                let getchildrens=(node)=>{
                    let char_space="";
                    for(let i=0;i<node.level;i++){
                        char_space+="    ";
                    }
                    let temp_row=[];
                    let colindex=0;
                    for (let field_name of this.arr_filter_vals) {
                        let temp_val=node[field_name];
                        //树状第一列拼空格显示层次结构
                        if(colindex==0){
                            temp_val=char_space+temp_val;
                        }
                        else{
                            if(arr_numericFields.includes(field_name) && !isNaN(temp_val) ){
                                temp_val=_this.format_number(temp_val);
                                if(temp_val== 0  ){
                                    temp_val='-';
                                 }
                            }
                            if(temp_val==undefined   ){
                                temp_val='';
                            }
                        }
                        let style_name=field_name+'_cell_style';
                        if(colindex==0){
                            style_name=node.fieldName+'_cell_style';
                        }
                      
                        let style_obj=node[style_name];
                        if( style_obj!=undefined ){
                             

                            if(this.cell_style_list[rowindex]==undefined){
                                this.cell_style_list[rowindex]={}
                            }
                            let temp_style={
                                font: {
                                    name: "微软雅黑", sz:9, color: { auto:1 },
                                },
                                fill: { 
                                    fgColor: { rgb: 'ffffff' }, 
                                },
                                border: {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                },
                                alignment: {
                                    horizontal: colindex==0?"left":"center",
                                    vertical: "center",
                                }
                            }
                            if( style_obj.fontSize!=undefined){
                                temp_style.font.sz=(style_obj.fontSize.replace('px',''))*1-4
                            }
                            if( style_obj.color!=undefined){
                                temp_style.font.color={rgb:style_obj.color.replace('#','')}
                            }
                            if( style_obj.backgroundColor!=undefined){
                                temp_style.fill.fgColor={rgb:style_obj.backgroundColor.replace('#','')}
                            }
                            this.cell_style_list[rowindex][colindex]=temp_style
                        }
                        temp_row.push(temp_val);
                        colindex++;
                    }
                    datalist.push(temp_row);
                    rowindex++;
                    if(node.children!=undefined){
                        for( let temp_node of node.children){
                            getchildrens(temp_node);
                        }
                    }
                 }
                for (let item of table_grid.visibleData) {
                    getchildrens(item);
                }
            }
            else{
                let rowindex=table_data.length+1;
                for (let  item of table_grid.visibleData) {
                    let temp_row = [];
                    let colindex=0
                    for (let field_name of this.arr_filter_vals) {
                        let temp_value=item[field_name];
                        if(arr_numericFields.includes(field_name) && !isNaN(temp_value) ){
                            temp_value=_this.format_number(temp_value);
                            if(temp_value== 0  ){
                                temp_value='-';
                            }
                        }
                        if(temp_value==undefined  ){
                            temp_value='';
                        }
                        
                        let style_name=field_name+'_cell_style';
                        let style_obj=item[style_name];
                        if( style_obj!=undefined  ){
                            if(this.cell_style_list[rowindex]==undefined){
                                this.cell_style_list[rowindex]={}
                            }
                            let temp_style ={
                                font: {
                                    name: "微软雅黑", sz:9, color: { auto:1},
                                },
                                fill: { 
                                    fgColor: { rgb: 'ffffff' }, 
                                },
                                border: {
                                    top: {  style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                },
                                alignment: {
                                    horizontal: "center",
                                    vertical: "center",
                                }
                            }
                            if( style_obj.fontSize!=undefined){
                                temp_style.font.sz=(style_obj.fontSize.replace('px',''))*1-4
                            }
                            if( style_obj.color!=undefined){
                                temp_style.font.color={rgb:style_obj.color.replace('#','')}
                            }
                            if( style_obj.backgroundColor!=undefined){
                                temp_style.fill.fgColor={rgb:style_obj.backgroundColor.replace('#','')}
                            }
                            this.cell_style_list[rowindex][colindex]=temp_style
                        }
                        temp_row.push(temp_value);
                        colindex++;
                    }
                    datalist.push(temp_row);
                    rowindex++;
                }
            }
            for (let item of table_grid.footerData) {
                let temp_row = [];
                for (let index in this.arr_filter_vals) {
                    let temp_value=item[index];
                    if( !isNaN(temp_value) ){
                        temp_value=_this.format_number(temp_value);
                    }
                    if(temp_value==undefined){
                        temp_value='';
                    }
                    temp_row.push(temp_value);
                }
                datalist.push(temp_row);
            }
             table_data=[...table_data,...datalist];
             let cellCount=1;
             let colsLen=0;
             if(table_data.length>0){
                colsLen=table_data[0].length;
             }
             let arr_ExcelColumnName=_this.getExcelColumnName(colsLen);
             let arr_subtotal_rowindex=[];
             let colindex=0;
             let arr_cell_style_list=this.cell_style_list;
             window.arr_cell_style_list=arr_cell_style_list;
             
            let subtotal_color="";
            let font_color="";
            let cls_subtotal_row=document.querySelector('.cls_subtotal_row');
            if(cls_subtotal_row!=null){
                let cls_subtotal_row_style=window.getComputedStyle(cls_subtotal_row);
                subtotal_color=cls_subtotal_row_style.color;
                font_color=this.rgbStringToHex(subtotal_color);
            }

            exportJsonToExcel({
                data: table_data,
                merges: cell_merges,
				 styleFun: function (ws) {
                     if( _this.report_type=='summary'){
                            Object.keys(ws).forEach((cell_name) => {
                                if (!cell_name.includes('!')) {
                                    let rowindex= cell_name.split(/\D+/).filter(Boolean).toString();
                                    if(colindex==colsLen){
                                        colindex=0;
                                    }
                                    let cell_style_obj= arr_cell_style_list[rowindex]==undefined?undefined: arr_cell_style_list[rowindex][colindex];
                                    if(_this.elradio_contentType=='tree' && cellCount% colsLen ==1 && rowindex!=2 ){
                                        //树状结构，第一列文本居左
                                        if(cell_style_obj==undefined){
                                            cell_style_obj=df_CellStyle_tree;
                                        }
                                        ws[cell_name].s = cell_style_obj;
                                    }
                                    else if(rowindex!=2){
                                        if(cell_style_obj==undefined){
                                            cell_style_obj=df_CellStyle;
                                        }
                                        ws[cell_name].s = cell_style_obj;
                                    }
                                    if( _this.report_type=='summary' && _this.elradio_contentType=='grid' && (ws[cell_name].v+'').includes("小计")){
                                        if(rowindex>head_rowTitle.length+2){
                                            arr_subtotal_rowindex.push(rowindex);
                                        }
                                    }
                                    if(rowindex==2 || rowindex==3 ){
                                        if(ws[cell_name].s!=undefined){
                                            ws[cell_name].s={
                                                border: {
                                                },
                                            };
                                        }
                                    }
                                    //判断是否为数值
                                    // if(_this.report_type=='summary' && !isNaN(parseFloat( ws[cell_name].v)) ){
                                    //     ws[cell_name].t="n";
                                    //     ws[cell_name].z="0.00000000";
                                    // }
                                    cellCount++;
                                    colindex++;
                                }
                            });
                            
                            try {
                                for (let item of ws['!cols']){
                                    if(item.wch>25){
                                        item.wch=25;
                                    }
                                }
                            } catch(err){
                                let a=1;
                            }

                        
                            for(let rowindex of arr_subtotal_rowindex){
                                let arr_cell_columnNames=arr_ExcelColumnName;
                                for(let colname of arr_cell_columnNames){
                                    let cellname=colname+rowindex;
                                    if(ws[cellname]!=undefined){
                                        ws[cellname].s={
                                            font: {
                                                name: "微软雅黑", sz: 9,bold:true, color: { rgb: font_color },
                                            },
                                            fill:{
                                                fgColor: { rgb: 'ffffff' }, 
                                            },
                                            border: {
                                                top: { style: 'thin' },
                                                left: { style: 'thin' },
                                                bottom: { style: 'thin' },
                                                right: { style: 'thin' }
                                            },
                                            alignment: {
                                                vertical: "center",
                                                horizontal: "center",
                                            }
                                        };
                                    }
                                }
                            }

                            ws['A1'].s = {
                        font: {
                            name: "微软雅黑",bold:true, sz: 14, color: { auto: 1 },
                        },
                        fill:{
                            fgColor: {  rgb:'ffffff'}, 
                        },
                        border: {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                             bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        },
                        alignment: {
							vertical: "center",
                            horizontal: "center",
                        }
                    };
                    ws['A2'].s = {
                        font: {
                            name: "微软雅黑", sz: 9, color: { auto: 1 },
                        },
                        fill:{
                            fgColor: {  rgb:'ffffff'}, 
                        }
                        ,border: {
                            top: { },
                            bottom: { },
                            left: { },
                            right: { },
                        },
                        alignment: {
							vertical: "bottom",
                            horizontal: "left",
                        }
                    };
                    //ws[arr_ExcelColumnName[cols_length]+'2'].s = {
                        ws['A3'].s = {
                        font: {
                            name: "微软雅黑", sz: 9, color: { auto: 1 },
                        },
                        fill:{
                            fgColor: {  rgb:'ffffff'}, 
                        }
                        ,border: {
                            top: { },
                            bottom: { },
                            left: { },
                            right: { },
                        },
                        alignment: {
							vertical: "top",
                            horizontal: "right",
                        }
                    };
                 
                 }
                 else{
                    try {
                        let firstColWidth= ws['!cols'][0].wch;
                        ws['!cols'][0].wch=firstColWidth/1.4;
                        ws['!cols'][ cols_length ].wch=ws['!cols'][ cols_length ].wch/2
                    } catch(err){
                        let a=1;
                    }
                 }
                   
                },
                filename: printTableTitle.replace(/\s+/g,''),
                bookType: 'xlsx',
                autoWidth: true,
                //XlsWidth:[{wch: 8}]
            });
        },
        rgbStringToHex(rgbString) {
            const rgbArray = rgbString.replace(/^rgb\(|\)$/g, '').split(',').map(Number);
            const hex = rgbArray.map(x => {
                const hexComponent = x.toString(16);
                return hexComponent.length === 1 ? '0' + hexComponent : hexComponent;
            }).join('');
            return '' + hex;
        },
        build_table_cell(cell){
            // 默认跨行和跨列数为1
            let rowSpan = cell.rowSpan || 1;
            let colSpan = cell.colSpan || 1;
            let temp_style={
                "background-color":"#fff",
                "font-size":"12px",
                "color":"#000",
                "text-align":"center",
                "border": "1px solid #000"
            }
            if(cell.style!=undefined){
                if(cell.style.backgroundColor!=undefined){
                    temp_style["background-color"]=cell.style.backgroundColor;
                }
                if(cell.style.fontSize!=undefined){
                    temp_style["font-size"]=cell.style.fontSize;
                }
                if(cell.style.color!=undefined){
                    temp_style["color"]=cell.style.color;
                }
                if(cell.style.textAlign!=undefined){
                    temp_style["text-align"]=cell.style.textAlign;
                }
            }
            // 将style对象转换为内联样式字符串
            let styles = Object.entries(cell.style || {}).map(([key, value]) => `${key}: ${value};`).join(' ');
            // 创建td标签字符串
            let td = `<td${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''}${colSpan > 1 ? ` colspan="${colSpan}"` : ''} ><div>  style="${styles}"${cell.text}</div></td>`;
            return td;
        }
        ,
        export_html_summary() {
            let _this = this ;
            let table_data=[];
            this.cell_style_list=[];
            let printTableTitle=document.getElementById('div_des_name').innerText.trim();
            let table_head_columns=_this.arr_filter_vals;
            let table_title=table_head_columns.map((item,idx)=>{ return idx==0?printTableTitle:'' });
            let div_des_remark=document.getElementById('div_des_remark').innerText.trim();
            if(div_des_remark.length<=1){
                div_des_remark="&nbsp;&nbsp;"+div_des_remark
            }
            let table_export_remark=table_head_columns.map((item,idx)=>{ 
               if(idx==0) { 
                    return div_des_remark; 
                } else {
                    return "" 
                } 
             });

             let table_export_date=table_head_columns.map((item,idx)=>{ 
                if(idx== 0){
                    return '打印时间：'+dateformat(getdate(),'yyyy-MM-dd HH:mm:ss');
                }
                else {
                    return "" 
                } 
             });
        
            table_data.push(table_title);
            table_data.push(table_export_remark);
            table_data.push(table_export_date);

            let cols_length=table_head_columns.length-1
            let cell_merges=[];
            let head_title_merge={
                col:0,
                row:0,
                colspan: cols_length+1,
                rowspan: 1
             }
             let export_remark_merge={
                col: 0,
                row:1,
                colspan: cols_length+1,
                rowspan: 1
             }
             let export_date_merge={
                col: 0,
                row:2,
                colspan: cols_length+1,
                rowspan: 1
             }
             
             cell_merges.push(head_title_merge);
             cell_merges.push(export_remark_merge);
             cell_merges.push(export_date_merge);
             let head_rowTitle=[];
             let maxlevel=_this.cols_fieldList.length==0?1:_this.cols_fieldList.length;
             if(_this.report_type!='summary'){
                maxlevel=0;
             }

             let fun_getColumn_vals= ( col_item ,col_index)=>{
                    let maxNodeCount=0;
                    let fun_getMaxNodeCount=(tempNode)=>{
                        if(tempNode.children!=undefined){
                            //在倒数第二级时，求和所有子级的个数
                            if( tempNode.children[0]!=undefined && tempNode.children[0].children==undefined){
                                maxNodeCount = maxNodeCount +  tempNode.children.length;
                            }
                            for(let tempitem of tempNode.children){
                                fun_getMaxNodeCount(tempitem);
                            }
                        } 
                    }
                   
                    fun_getMaxNodeCount(col_item);
                    maxNodeCount=maxNodeCount==0?1:maxNodeCount;
                    let rowindex=col_item.level;
                    for(let i=1;i<=maxNodeCount;i++){
                        if(head_rowTitle[rowindex]==undefined){
                            head_rowTitle[rowindex]=[];
                        }
                        for(let j=0;j<col_index;j++){
                            if(head_rowTitle[rowindex][j]==undefined){
                                head_rowTitle[rowindex][j]=''
                            }
                        }
                        if(i==1){
                            head_rowTitle[rowindex].push(col_item.title);
                        }
                        else{
                            head_rowTitle[rowindex].push("");
                        }
                    }
                    if(col_item.level!=maxlevel && col_item.name!='虚拟node' ){
                        let rowspan=col_item.children!=undefined && col_item.children[0]!=undefined && col_item.children[0].name=='虚拟node'?maxlevel-col_item.level:0
                        let colspan=maxNodeCount;
                       
                        let col_merge={
                            col: head_rowTitle[rowindex].length-colspan,
                            row:table_data.length+col_item.level,
                            colspan: colspan==0?1:colspan,
                            rowspan: rowspan==0?1:rowspan+1
                        }
                        cell_merges.push(col_merge);
                    }
             };

             let fun_getNodes=(tempNode,col_index)=>{
                if(tempNode.children==undefined && tempNode.level!=maxlevel){
                    tempNode.children=[{ name:'虚拟node', title:'',level:tempNode.level+1 }]
                }
                if(tempNode.children!=undefined){
                    for(let tempitem of tempNode.children){
                        fun_getNodes(tempitem,col_index);
                    }
                }
                fun_getColumn_vals(tempNode,col_index);
            }

            for(let i=0;i<_this.ux_grid_columns.length;i++){
                let col_item=_this.ux_grid_columns[i];
                let col_index=i;
                fun_getNodes(col_item,col_index);
            }

            table_data=[...table_data,...head_rowTitle];
            
            for (let item of _this.cells_merge) {
                cell_merges.push({
                    col: item.col,
                    row: item.row + table_data.length,
                    colspan: item.colspan ,
                    rowspan: item.rowspan
                });
            } 
           
            let table_grid = this.$refs.plxTable.getTableData();
            let datalist = [];
            let arr_numericFields=_this.groupNumerics_list.map(ite=>ite.cname);
            arr_numericFields=[...arr_numericFields,...(_this.numerics_fieldlist.map(ite=>ite.name))  ]
            if(this.cell_style_list==undefined){
                this.cell_style_list={body_startIndex:table_data.length};
            }
            if(_this.elradio_contentType=='tree'){
                let rowindex=table_data.length;
                let getchildrens=(node)=>{
                    let char_space="";
                    for(let i=0;i<node.level;i++){
                        char_space+="&nbsp;&nbsp;&nbsp;&nbsp;";
                    }
                    let temp_row=[];
                    let colindex=0;
                    for (let field_name of this.arr_filter_vals) {
                        let temp_val=node[field_name];
                        //树状第一列拼空格显示层次结构
                        if(colindex==0){
                            temp_val=char_space+temp_val;
                        }
                        else{
                            if(arr_numericFields.includes(field_name) && !isNaN(temp_val) ){
                                temp_val=_this.format_number(temp_val);
                                if(temp_val== 0  ){
                                    temp_val='-';
                                }
                            }
                            if(temp_val==undefined  ){
                                temp_val='';
                            }
                        }
                        let style_name=field_name+'_cell_style';
                        if(colindex==0){
                            style_name=node.fieldName+'_cell_style';
                        }
                      
                        let style_obj=node[style_name]||{};
                        if(this.cell_style_list[rowindex]==undefined){
                            this.cell_style_list[rowindex]={}
                        }
                        let temp_style={
                            "background-color":"#fff",
                            "font-size":"12px",
                            "color":"#000",
                            "text-align":colindex==0?"left":"center",
                        }
                        if( style_obj.fontSize!=undefined){
                            temp_style["font-size"]=style_obj.fontSize;
                        }
                        if( style_obj.color!=undefined){
                            temp_style["color"]=style_obj.color
                        }
                        if( style_obj.backgroundColor!=undefined){
                            temp_style["background-color"]=style_obj.backgroundColor
                        }
                        this.cell_style_list[rowindex][colindex]=temp_style
                        temp_row.push(temp_val);
                        colindex++;
                    }
                    datalist.push(temp_row);
                    rowindex++;
                    if(node.children!=undefined){
                        for( let temp_node of node.children){
                            getchildrens(temp_node);
                        }
                    }
                 }
                for (let item of table_grid.visibleData) {
                    getchildrens(item);
                }
            }
            else{
                let rowindex=table_data.length;
                let subtotal_color="";
                let fontSize="";
                let cls_subtotal_row=document.querySelector('.cls_subtotal_row');
                if(cls_subtotal_row!=null){
                    let cls_subtotal_row_style=window.getComputedStyle(cls_subtotal_row);
                    subtotal_color=cls_subtotal_row_style.color;
                    fontSize=cls_subtotal_row_style.fontSize;
                }
                for (let  item of table_grid.visibleData) {
                    let temp_row = [];
                    let colindex=0
                    for (let field_name of this.arr_filter_vals) {
                        let temp_value=item[field_name];
                        if(arr_numericFields.includes(field_name) && !isNaN(temp_value) ){
                            temp_value=_this.format_number(temp_value);
                            if(temp_value== 0  ){
                                temp_value='-';
                            }
                        }
                        if(temp_value==undefined  ){
                            temp_value='';
                         }

                         if(item["type"]=='total'){
                            if(this.cell_style_list[rowindex]==undefined){
                                this.cell_style_list[rowindex]={}
                            }
                            let temp_style={};
                            temp_style["font-size"]=fontSize;
                            temp_style["font-weight"]="bold";
                            temp_style["color"]=subtotal_color;
                            temp_style["font-weight"]="bold";
                            this.cell_style_list[rowindex][colindex]=temp_style
                        }

                        let style_name=field_name+'_cell_style';
                        let style_obj=item[style_name];
                        if( style_obj!=undefined  ){
                            if(this.cell_style_list[rowindex]==undefined){
                                this.cell_style_list[rowindex]={}
                            }
                            let temp_style={
                                "background-color":"#fff",
                                "font-size":"12px",
                                "color":"#000",
                                "text-align":"center",
                                // "border": "1px solid #000"
                            }
                            if( style_obj.fontSize!=undefined){
                                temp_style["font-size"]=style_obj.fontSize;
                            }
                            if( style_obj.color!=undefined){
                                temp_style["color"]=style_obj.color
                            }
                            if( style_obj.backgroundColor!=undefined){
                                temp_style["background-color"]=style_obj.backgroundColor
                            }
                            this.cell_style_list[rowindex][colindex]=temp_style
                        }
                        
                        temp_row.push(temp_value);
                        colindex++;
                    }
                    datalist.push(temp_row);
                    rowindex++;
                }
            }
            for (let item of table_grid.footerData) {
                let temp_row = [];
                for (let index in this.arr_filter_vals) {
                    let temp_value=item[index];
                    if( !isNaN(temp_value) ){
                        temp_value=_this.format_number(temp_value);
                        if( temp_value== 0){
                            temp_value='-';
                        }
                    }
                    if(temp_value==undefined){
                        temp_value='';
                    }
                    temp_row.push(temp_value);
                }
                datalist.push(temp_row);
            }
            table_data=[...table_data,...datalist];

            let coveredCells = {};
            for(let spanObject of cell_merges ){
                if(spanObject.rowspan==0 && spanObject.colspan==0){
                    spanObject.rowspan=1;
                    spanObject.colspan=1;  
                }
                for (let i = spanObject.row; i < spanObject.row + spanObject.rowspan; i++) {
                    coveredCells[i] = coveredCells[i] || {};
                    for (let j = spanObject.col; j < spanObject.col + spanObject.colspan; j++) {
                        coveredCells[i][j] = true;
                    }
                }
            }
            // window.coveredCells=coveredCells;
            // window.cell_merges=cell_merges;
            // window.cell_style_list=this.cell_style_list;
            // window.table_data=table_data;

            this.cell_style_list[0]={0:{}}
            this.cell_style_list[0][0]={"background-color": '#fff', "font-size": '16px',"font-weight":"bold", "color": '#000', "text-align": 'center'}
            this.cell_style_list[1]={0:{}}
            this.cell_style_list[1][0]={"background-color": '#fff', "font-size": '12px', "color": '#000', "text-align": 'left',"border":"none"}
            this.cell_style_list[2]={0:{}}
            this.cell_style_list[2][0]={"background-color": '#fff', "font-size": '12px', "color": '#000', "text-align": 'right',"border":"none","float": "right" ," margin-top": "-26px"}
            
           

            let html_text="";
            for(let i=0;i<table_data.length;i++){
                let temp_row=table_data[i];
                let str_tr="<tr>";
                for(let j=0;j<temp_row.length;j++){
                    let iscov=coveredCells[i] && coveredCells[i][j];
                    let merge=cell_merges.find(ite=>ite.row==i && ite.col==j);
                    //如果是被跨行跨列覆盖的单元格则跳过
                    if(iscov && merge==undefined){
                        continue;
                    }
                    if(merge==undefined){
                        merge={rowspan:1,colspan:1};
                    }
                    // 默认跨行和跨列数为1
                    let rowspan = merge["rowspan"];
                    let colspan = merge["colspan"];
                    let style={
                        "background-color":"#fff",
                        "font-size":"12px",
                        "color":"#000",
                        "text-align":"center",
                    }
                    if(this.cell_style_list[i]!=undefined){
                        style={...style,...this.cell_style_list[i][j]} 
                    }
                    // 将style对象转换为内联样式字符串
                    let styles = Object.entries(style || {}).map(([key, value]) => `${key}: ${value};`).join(' ');
                    // 创建td标签字符串
                    let td = `<td  rowspan="${rowspan}" style="${(style||{}).border==undefined?'':'border:'+style.border+';'}"  colspan="${colspan}" > <div style="${styles};padding:4px; overflow: hidden;text-overflow: ellipsis;white-space: nowrap;max-height:24px;">${temp_row[j]}</div> </td>`;
                    str_tr+=td;
                }
                str_tr+="</tr>";
                html_text+=str_tr;
            }
            return html_text;
        },
         getExcelColumnName(start) {
            let cell_columnNames=[]
            for(let i=1;i<=start;i++){
                let columnName = '';
                let columnNumber=i;
                while (columnNumber > 0) {
                    columnNumber--;
                    columnName = String.fromCharCode(65 + (columnNumber % 26)) + columnName;
                    columnNumber = Math.floor(columnNumber / 26);
                }
                cell_columnNames.push(columnName)
            }
            return cell_columnNames ;
        },
      
        load_rptParams() {
            let _this = this;
            let map_boolean = { "true": "true", "false": "false" };

            _this.rpt_des_name = "";
            _this.hide_fieldslist = [];
            _this.rows_fieldList = [];
            _this.cols_fieldList = [];
            _this.numerics_fieldlist = [];
            _this.rpt_des_name = "";
            _this.rsp_datalist = [];
            let reportinfo = _this.rsp_jsonData.report_descript;
            _this.reportinfo = reportinfo;
            _this.rpt_des_name = reportinfo.rpt_des_name;
            _this.report_type = reportinfo.rpt_cfg_type == undefined || reportinfo.rpt_cfg_type == '' ? 'summary' : reportinfo.rpt_cfg_type;
            _this.elradio_tableType = _this.report_type;
            _this.elradio_contentType = reportinfo.rpt_cfg_contentType == undefined || reportinfo.rpt_cfg_contentType == '' ? 'grid' : reportinfo.rpt_cfg_contentType;
            _this.expandTreelevel = reportinfo.rpt_cfg_expandTreelevel == undefined || reportinfo.rpt_cfg_expandTreelevel == '' ? 1 : reportinfo.rpt_cfg_expandTreelevel;
            _this.elradio_autoFrozenCols = reportinfo.rpt_cfg_autoFrozenCols == undefined || reportinfo.rpt_cfg_autoFrozenCols == '' ? "false" : reportinfo.rpt_cfg_autoFrozenCols;
            _this.elradio_autoFrozenCols = map_boolean[_this.elradio_autoFrozenCols];
            _this.isShow_frozenCols = _this.elradio_autoFrozenCols == 'true' ? true : false;
            _this.isShow_treelevel = _this.elradio_contentType == 'tree' ? true : false;
            _this.frozenCols = reportinfo.rpt_cfg_frozenCols == undefined || reportinfo.rpt_cfg_frozenCols == '' ? "3" : reportinfo.rpt_cfg_frozenCols;
            _this.rsp_datalist = _this.rsp_jsonData.datalist;
            _this.rsp_datalist_initial=_this.rsp_jsonData.datalist;
            // _this.rsp_datalist_original= Immutable.List(this.rsp_jsonData.datalist);
            _this.filter_fieldlist=reportinfo.rpt_cfg_filterlist == undefined?{}:reportinfo.rpt_cfg_filterlist;
            _this.isShow_ColSubtotal=_this.report_type=='summary'?true:false;
            _this.elradio_isShow_ColSubtotal = reportinfo.rpt_cfg_ShowColSubtotal == undefined || reportinfo.rpt_cfg_ShowColSubtotal == '' ? "false" : reportinfo.rpt_cfg_ShowColSubtotal;
            _this.elradio_isShow_ColSubtotal = map_boolean[_this.elradio_isShow_ColSubtotal];

            _this.elradio_rowSubtotalStyle = reportinfo.rpt_cfg_rowSubtotal_style == undefined || reportinfo.rpt_cfg_rowSubtotal_style == '' ? "simple" : reportinfo.rpt_cfg_rowSubtotal_style;
            _this.ipt_rowSubtotal_numberColumns=reportinfo.rpt_cfg_rowSubtotal_numberColumns== undefined || reportinfo.rpt_cfg_rowSubtotal_numberColumns == '' ?0:reportinfo.rpt_cfg_rowSubtotal_numberColumns;
            // if(reportinfo.rpt_cfg_rowSubtotal_numberColumns== undefined || reportinfo.rpt_cfg_rowSubtotal_numberColumns == ''){
            //     alert(_this.ipt_rowSubtotal_numberColumns);
            //     this.ipt_rowSubtotal_numberColumns=100
            // }
            _this.orderby_fields=reportinfo.rpt_cfg_orderby_fields==undefined||reportinfo.rpt_cfg_orderby_fields==''?{}:reportinfo.rpt_cfg_orderby_fields;
           
      
           
            _this.elradio_isShow_ColAlltotal = reportinfo.rpt_cfg_ShowColAlltotal == undefined || reportinfo.rpt_cfg_ShowColAlltotal == '' ? "false" : reportinfo.rpt_cfg_ShowColAlltotal;
            _this.elradio_isShow_ColAlltotal = map_boolean[_this.elradio_isShow_ColAlltotal];

            _this.conditionFields_list=reportinfo.conditionFields_list==undefined?[]:reportinfo.conditionFields_list;
            
            _this.elradio_separator= reportinfo.rpt_cfg_separator== undefined ||reportinfo.rpt_cfg_separator==''?'false':reportinfo.rpt_cfg_separator
            _this.elradio_separator = map_boolean[_this.elradio_separator];
            _this.ipt_decimalPlaces = reportinfo.rpt_cfg_decimalPlaces== undefined || reportinfo.rpt_cfg_decimalPlaces == '' ? "2" : reportinfo.rpt_cfg_decimalPlaces;
            _this.rpt_des_remark=reportinfo.rpt_des_remark;


            _this.initFieldsParam();

            _this.rowSubtotal_numberColumns_max=this.rows_fieldList.length-1;
            if(reportinfo.rpt_cfg_rowSubtotal_numberColumns== undefined || reportinfo.rpt_cfg_rowSubtotal_numberColumns == ''){
                this.ipt_rowSubtotal_numberColumns=this.rows_fieldList.length;
            }

            let temp_order= this.numerics_fieldlist.find( ite=> Object.keys(this.orderby_fields).includes(ite.name) );
            if(temp_order!=undefined){
                this.orderby_fields["isNumberField"]=true;
            }

            let grid_config = {
                report_type: _this.report_type
                , elradio_contentType: _this.elradio_contentType
                , expandTreelevel: _this.expandTreelevel
                , elradio_autoFrozenCols: _this.elradio_autoFrozenCols
                , frozenCols: _this.frozenCols
                , rows_fieldList: _this.rows_fieldList
                , cols_fieldList: _this.cols_fieldList
                , numerics_fieldlist: _this.numerics_fieldlist
                , hide_fieldslist: _this.hide_fieldslist
                , size_style: _this.size_style
                , isShow_frozenCols: _this.isShow_frozenCols
                , isShow_treelevel: _this.isShow_treelevel
                , isShow_ColSubtotal: _this.isShow_ColSubtotal
                , elradio_isShow_ColSubtotal: _this.elradio_isShow_ColSubtotal
                , elradio_rowSubtotalStyle: _this.elradio_rowSubtotalStyle
                ,ipt_rowSubtotal_numberColumns:_this.ipt_rowSubtotal_numberColumns
                ,orderby_fields:_this.orderby_fields
                ,elradio_isShow_ColAlltotal:_this.elradio_isShow_ColAlltotal
                , elradio_separator:_this.elradio_separator
                , ipt_decimalPlaces:_this.ipt_decimalPlaces
                ,conditionFields_list:_this.conditionFields_list
            }
            _this.custom_templates[0].grid_config = grid_config;

            this.handle_refreshConditionFields();
            
            let arr_templates = Object.keys(localStorage);
            for (let item of arr_templates) {
                let ec_key= item;
                let filename=encodeURIComponent(_this.rpt_des_name+'_cus_umytable');
                if(ec_key.indexOf(filename)>-1){
                    let t_key = decodeURIComponent( ec_key.replace(filename,''));
                    let t_value =localStorage.getItem(ec_key);
                    try {
                        let t_cfg = JSON.parse(decodeURIComponent(t_value));
                        if (t_cfg.report_type != undefined && t_key!='系统默认') {
                            _this.custom_templates.push({
                                label: t_key,
                                value: t_key,
                                grid_config: t_cfg
                            });
                        }
                    }
                    catch (err) {
                        let a = 0;
                    }
                }
            }

            //加载预定义自定义list
            if( _this.rsp_jsonData.custom_templates!=undefined ){
                let temp_templates=_this.rsp_jsonData.custom_templates;
                try{
                    temp_templates= JSON.parse(_this.rsp_jsonData.custom_templates);
                }
                catch(err){
                    let a=1
                }
                temp_templates.filter(item=> !_this.custom_templates.map(ite=>ite.label).includes(item.label) ).forEach( (tempcfg,index)=>{
                    tempcfg.cus_type='system';
                    _this.custom_templates.push(tempcfg);
                } );
               
            }

            this.rowSubtotal_numberColumns_max=this.rows_fieldList.length-1;

            //加载上次选中的自定义
            let sel_templateName = decodeURIComponent( _this.getCookie('sel_templateName'));
            if(sel_templateName!='' && sel_templateName!=null){
                _this.sel_templateName=sel_templateName;
                _this.handle_templateItemChange();
            }
            else{
                _this.initTable();
            }
            //_this.ipt_templateName = _this.sel_templateName;
        },
        
        isExecutableScript(script) {
            const acorn = require('acorn');
            const walk = require('acorn-walk');
            if(window.acorn==undefined){
                window.acorn=acorn;
                window.walk=walk;
            }
            if(script==undefined || script.length<1){
                return true;
            }
            // 定义允许的函数关键字
            if(this.allowedFunctions==undefined){
                this.allowedFunctions=[];
                for(let listItem of this.function_description_list){
                    if(listItem.label!='运算符'){
                        let arraylist=listItem.function_item;
                        for(let item of arraylist){
                            this.allowedFunctions.push(item.keyword);
                        }
                    }
                }
            }
            this.allowedFunctions.push('sum');
            this.allowedFunctions.push('cell');
            const allowedFunctions=this.allowedFunctions;
            let ast =null
            // 解析脚本
            try {
                 ast = acorn.parse(script, { ecmaVersion: 2024 });

            } catch (error) {
                throw new Error(`非法的表达式!`);
            }
            let temp_obj=ast.body[0].expression;
            if(temp_obj.type=='Identifier' && isNaN( temp_obj.name ) ){
                throw new Error(`非法的字符 "${temp_obj.name}"! `);
            }
            if(temp_obj.property!=undefined ){
                throw new Error(`非法的属性 "${temp_obj.property.name}"! `);
            }
            
            // 遍历 AST
            walk.simple(ast, {
                CallExpression(node) {
                    // 检查调用的函数是否在允许列表中
                    if (node.callee.type === 'Identifier') {
                        if (!allowedFunctions.includes(node.callee.name)) {
                            throw new Error(`函数 "${node.callee.name}" 未定义!`);
                        }
                    } else if (node.callee.type === 'MemberExpression') {
                        const functionName = `${node.callee.object.name}.${node.callee.property.name}`;
                        if (!allowedFunctions.includes(functionName) || !allowedFunctions.includes(node.callee.property.name)  ) {
                            throw new Error(`函数 "${functionName.replace('undefined.','')}" 未定义!`);
                        }
                    }
                }
            });
            return true; 
        },
        initTable() {
            let _this = this;
            let startTime=new Date();
            let loading = _this.$loading({
                lock: true,
                text: '页面加载中,请稍等...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.3)',
                color: "#000",
            });
            try {
                _this.rowSubtotal_numberColumns_max=this.rows_fieldList.length;
                if (_this.report_type == 'summary' && this.mergedDataMap.size==0) {
                    this.handle_ConditionUpdateToFields();
                    //多条相同字段合并成一条，数值字段求和
                    let mergedDataMap=this.mergedDataMap;
                    let arr_fields=[..._this.rows_fieldList.map(ite=>ite.name),..._this.cols_fieldList.map(ite=>ite.name)];
                    let arr_numerics_fields=_this.numerics_fieldlist.map(ite=>ite.name)
                    let condition_len=this.conditionFields_execute.length;
                    for(let rowdata of _this.rsp_datalist_initial){
                        if(condition_len>0){
                             rowdata= this.bindConditionField(rowdata,null,this.conditionFields_execute);
                        }
                        let key=Object.keys(rowdata).filter(item=>arr_fields.includes(item) ).map(item2=>{ return rowdata[item2] }) .join('-');
                        if( !mergedDataMap.has(key)) {
                            let temp_obj={};
                            let arr_cell_style=Object.keys(rowdata).filter(ite=>ite.indexOf('_cell_style')>-1 || ite.indexOf('_linkUrl')>-1 || ite.indexOf('_linkTarget')>-1 )
                            let all_fields=[...arr_fields,...arr_numerics_fields,...arr_cell_style]
                            for(let col_name of all_fields){
                                temp_obj[col_name]=rowdata[col_name];
                            }
                            mergedDataMap.set(key,temp_obj);
                        }
                        else{
                            let temp_obj=mergedDataMap.get(key);
                            for(let item of arr_numerics_fields){
                                if( isNaN(rowdata[item])==false ){
                                    temp_obj[item] = temp_obj[item]*1+ rowdata[item]*1;
                                }
                            }
                            mergedDataMap.set(key,temp_obj);
                        }
                    }
                    let mergedData = Array.from(mergedDataMap.values());
                    _this.rsp_datalist=mergedData;
                }

                _this.ux_grid_header = [];
                _this.ux_grid_datas = [];
                window.tableRowCount=0
                

                let report_descript= {
                    "rpt_des_name": _this.rpt_des_name,
                    "rpt_des_remark":_this.rpt_des_remark,
                    "rpt_des_rowFields": _this.rows_fieldList.map(item=>item.name).toString(),
                    "rpt_des_colFields": _this.cols_fieldList.map(item=>item.name).toString(),
                    "rpt_des_numericFields": _this.numerics_fieldlist.map(item=>item.name).toString(),
                    "rpt_des_hideFields": _this.hide_fieldslist.map(item=>item.name).toString(),
                    "rpt_cfg_type":_this.report_type,
                    "rpt_cfg_ShowColSubtotal":_this.isShow_ColSubtotal,
                    "rpt_cfg_ShowColAlltotal":_this.elradio_isShow_ColAlltotal,
                    "rpt_cfg_contentType": _this.elradio_contentType,
                    "rpt_cfg_expandTreelevel":_this.expandTreelevel,
                    "rpt_cfg_autoFrozenCols":_this.elradio_autoFrozenCols,
                    "rpt_cfg_frozenCols":_this.frozenCols,
                    "rpt_cfg_separator" :_this.elradio_separator,
                    "rpt_cfg_decimalPlaces" : _this.ipt_decimalPlaces,
                    "rpt_des_data":_this.rsp_datalist_initial[0],
                    "rpt_cfg_rowSubtotal_style":_this.elradio_rowSubtotalStyle,
                    "rpt_cfg_rowSubtotal_numberColumns":_this.ipt_rowSubtotal_numberColumns,
                    "rpt_cfg_orderby_fields":_this.orderby_fields,
                    "conditionFields_list":_this.conditionFields_list
                }
                if(window.cus_umytable==undefined){
                    window.cus_umytable={report_descript:{}}
                }
                window.cus_umytable.report_descript=report_descript;
                window.cus_umytable.custom_templates=_this.custom_templates;
                window.cus_umytable.datalist=_this.rsp_jsonData.datalist;
                window.cus_umytable.filterlist=_this.filter_fieldlist;

                _this.groupNumerics_fieldlist = [];
                _this.getTableColumn();
                _this.cells_merge = [];
                _this.$refs.plxTable.reloadData([]);
                _this.groupNumerics_list = [];
                _this.groupNumerics_map =new Map();
            
                for (let item of _this.groupNumerics_fieldlist) {
                    let arr_col = item.split(',');
                    if(item.indexOf(',')<0 || arr_col.includes('~')  ){
                        continue;
                    }
                    let temp_obj = { filters: {} };
                    let cname = item.replace(/,/g, '');
                    for (let i = 0; i < arr_col.length - 1; i++) {
                        temp_obj['filters'][_this.cols_fieldList[i].name] = arr_col[i];
                    }
                    temp_obj["total_field"] = arr_col[arr_col.length - 1];
                    temp_obj["cname"] = cname;
                    temp_obj["split_name"]=item;
                    _this.groupNumerics_list.push(temp_obj);

                    temp_obj[arr_col[arr_col.length - 1]]=cname;
                    let keyname=arr_col.filter((ite,index)=>index<arr_col.length - 1).join(',');
                    if( _this.groupNumerics_map.get(keyname)==undefined  ){
                        _this.groupNumerics_map.set(keyname,temp_obj);
                    }
                    else{
                        let map_obj=_this.groupNumerics_map.get(keyname);
                        map_obj[arr_col[arr_col.length - 1]]=cname;
                        _this.groupNumerics_map.set(keyname,map_obj);
                    }
                }
                let keyname_temp='all'
                _this.groupNumerics_map.set(keyname_temp,{})
                for(let item of _this.numerics_fieldlist){
                    let tempobj={
                        cname:item.name,
                        split_name:item.name,
                        total_field:item.name,
                        filters:[]
                    }
                    tempobj[item.name]=item.name;
                    _this.groupNumerics_list.push(tempobj);
                    let map_obj=_this.groupNumerics_map.get(keyname_temp);
                    map_obj[item.name]=item.name;
                    _this.groupNumerics_map.set(keyname_temp,map_obj);
                }
                 
                // window.cus_umytable.groupNumerics_list=_this.groupNumerics_list;
                // window.cus_umytable.groupNumerics_map=_this.groupNumerics_map;
                // window.cus_umytable.columns=_this.ux_grid_columns;
                this.arr_groupNumerics_list =Array.from( this.groupNumerics_map.values());

                if (_this.elradio_contentType == "tree") {
                    // _this.ux_grid_treeConfig={ children: 'children',expandAll:true};
                    _this.ux_grid_treeConfig = { children: 'children' };
                    _this.ux_grid_treeData = [];
                    _this.expandTreeNodes = [];
                    //tree树状下，实现列筛选
                    let griddatalist=_this.rsp_datalist;
                    let rsp_datalist =_this.getFilterDatalist(griddatalist);
                    let treeData= _this.buildTreeData3(rsp_datalist);
                    _this.ux_grid_treeData=_this.getmapdata(treeData,null);
                    // window.cus_umytable.treeset=treeData;
                    window.cus_umytable.dataset= _this.ux_grid_treeData;
                }
                else{
                    _this.ux_grid_treeConfig = null;
                    _this.ux_grid_datas = [];
                    if (_this.report_type == 'summary') {
                        //grid表格下，实现列筛选
                        let griddatalist= _this.rsp_datalist;
                        let rsp_datalist =_this.getFilterDatalist(griddatalist);
                        let treeData= _this.buildTreeData3(rsp_datalist);
                        _this.getmapdata_grid(treeData,null);

                        //_this.getMarge_cells(_this.ux_grid_datas)
                        window.cus_umytable.dataset=_this.ux_grid_datas;
                        //    window.cus_umytable.treeset=treeData;
                    }
                    else{
                        _this.rsp_datalist= _this.rsp_datalist_initial;
                        let griddatalist= _this.rsp_datalist_initial;
                        let rsp_datalist =_this.getFilterDatalist(griddatalist);
                        _this.ux_grid_datas=rsp_datalist
                        window.cus_umytable.dataset=_this.ux_grid_datas;
                        // window.cus_umytable.treeset=new Map();
                    }
                }
                let endTime =new Date();
                // console.log(`数据总条数:${_this.rsp_datalist.length}, 数据处理时长: ${ (endTime - startTime).toFixed(2)} ms`);
                // Message.info({showClose: true,duration:350,message:`数据总条数:${_this.rsp_datalist_initial.length}, 数据处理时长: ${ (endTime - startTime).toFixed(2)} ms`});
                // startTime=new Date();
                setTimeout(() => {
                    try {
                        
                        if (_this.elradio_contentType == "tree") {
                            if (_this.ux_grid_treeData.length > 0) {
                                _this.$refs.plxTable.reloadData(_this.ux_grid_treeData);
                                
                                    setTimeout(() => {
                                        for (let node of _this.expandTreeNodes) {
                                            _this.$refs.plxTable.setTreeExpand(node, true)
                                        }
                                    }, 200);
                            }
                            _this.cells_merge = [{row:0,col:0,rowspan:0,colspan:0}];
                        }
                        else {
                            _this.$refs.plxTable.reloadData(_this.ux_grid_datas);
                        }
                        endTime =new Date();
                        
                        window.cus_umytable.completed=`数据条数:${_this.rsp_datalist_initial.length}, 加载时长: ${ (endTime-200 - startTime).toFixed(2)} ms`;
                        
                        loading.close();
                        //动态table标题头的筛选事件
                        if(this.elradio_contentType=='grid'){
                            setTimeout(() => {
                                let arr_dom=document.getElementsByClassName("icon_filter_title");
                                for(let i=0;i<arr_dom.length;i++  ){
                                    try{
                                        let temp_obj=arr_dom[i];
                                        let name=_this.rows_fieldList[i].name;
                                        
                                        let parentEle=temp_obj.parentElement;
                                        //删除原dom对象，重新绑定事件，以免事件冲突
                                        parentEle.removeChild(temp_obj);
                                        var newElement = document.createElement('i'); 
                                        newElement.setAttribute("name",name);
                                        newElement.setAttribute("class","el-icon-arrow-down icon_filter_title")
                                        newElement.addEventListener('click', function() {
                                            _this.handle_Tagclick(name,'row');
                                        });
                                        parentEle.appendChild(newElement); 
                                    }
                                    catch(err ){
                                        loading.close();
                                    }
                                }
                            }, 200);
                        }
                        else{
                            let arr_dom=document.getElementsByClassName("icon_filter_title");
                            for(let i=0;i<arr_dom.length;i++  ){
                                try{
                                    let temp_obj=arr_dom[i];
                                    let name=_this.rows_fieldList[i].name;
                                    
                                    let parentEle=temp_obj.parentElement;
                                    //删除原dom对象，重新绑定事件，以免事件冲突
                                    parentEle.removeChild(temp_obj);
                                     
                                }
                                catch(err ){
                                    loading.close();
                                }
                            }
                        }

                    }
                    catch(err){
                        loading.close();
                        console.error(err);
                    }

                }, 200);
            }
            catch(err){
                loading.close();
                Message.error(err+"");
                throw err;
            }
           
            setTimeout(() => {
                loading.close();
            }, 8000);
        },
        getFilterDatalist(datalist){
            let _this=this;
            let rsp_datalist = datalist;
            Object.keys(_this.filter_fieldlist).forEach((keyname, index) => {
                // if (keyname != null && keyname.trim() != '' && _this.filter_fieldlist[keyname].length > 0 && !_this.cols_fieldList.map(item => item.name).includes(keyname)) {
                if (keyname != null && keyname.trim() != '' && _this.filter_fieldlist[keyname].length > 0 ) {
                    rsp_datalist = rsp_datalist.filter(item => _this.filter_fieldlist[keyname].includes(item[keyname]+""));
                }
            });
            return rsp_datalist;
        },
        getColumnValues(columnName) {
            let _this = this;
            if (_this.ColumnValues[columnName] == undefined) {
                _this.ColumnValues[columnName] = [...new Set(_this.rsp_datalist.map(item => { return item[columnName]+"" }))]
            }
            return _this.ColumnValues[columnName];
        },
        getTableColumn() {
            let _this = this, _ux_grid_columns = [];
            _this.ux_grid_columns = [];
            _this.arr_filter_vals = [];
            const arr_rows = [];
            if (_this.elradio_contentType == "tree") {
                let keyname = _this.rows_fieldList.map(item => item.name).join('/');
                arr_rows.push({ name: keyname });
            }
            else {
                for (let item of _this.rows_fieldList) {
                    arr_rows.push(item);
                }
            }
            if (_this.report_type != 'summary') {
                for (let item of this.numerics_fieldlist) {
                    if (arr_rows.filter(val => val.name == item.name).length < 1) {
                        item.order = arr_rows.length + item.order;
                        arr_rows.push(item);
                    }
                }
            }
            for (let index in arr_rows) {
                let colname=arr_rows[index].name;
                
                let _colitem = {
                    title: colname,
                    align: 'center',
                    resizable: true,
                    field: colname,
                    slots: {
                        header: ({ column }) => {
                            let filtervalues = this.filter_fieldlist[column.property];
                            let filterLength = filtervalues != undefined ? filtervalues.length : 0;
                            // let classname= _this.elradio_contentType=="tree"?"":"el-icon-arrow-down icon_filter_title";
                           
                            let classname="";
                            if(this.elradio_contentType=="grid"){
                                classname="el-icon-arrow-down icon_filter_title";
                            }
                            let str_orderbyFlag="";
                            let str_filterCount="";
                            if(this.elradio_tableType=="summary"){
                                if(this.orderby_fields[column.title]=='asc' ){
                                    str_orderbyFlag=" ↑ ";
                                }
                                else if(this.orderby_fields[column.title]=='desc' ){
                                    str_orderbyFlag=" ↓ ";
                                }
                            }
                            if (filterLength > 0) {
                                str_filterCount=`【筛选数:${filterLength}】`;
                            }
                            
                            return [
                                <p>
                                    {column.title}  
                                    <i class={classname} name={column.title} ></i>
                                    <span style='font-weight: bold;color: #9d40ff;font-size:13px;'>{str_orderbyFlag}</span>
                                    <span style="color: #9d40ff;font-size:10px;">{str_filterCount}</span>
                                </p>
                            ]
                            
                         },
                         default: ({ row, column }, h) => {
                            return this.cellDataToHtml(row,column,h,"row",colname);
                        }
                    },
                };
                _colitem['minWidth'] = 150;
                _colitem["level"]=0;
                if (_this.elradio_autoFrozenCols == "true") {
                    if (parseInt(index) + 1 <= _this.frozenCols) {
                        _colitem.fixed = "left";
                    }
                }
                if (_this.elradio_contentType == "tree") {
                    _colitem.treeNode = true;
                    _colitem.align = 'left';
                    _colitem.minWidth = 150 + (_this.rows_fieldList.length * 30);
                    _colitem.field='tree_nodeName'
                    delete _colitem.filters;
                }
                _this.ux_grid_header.push(arr_rows[index].name);
                _this.arr_filter_vals.push(arr_rows[index].name);

                if (_this.report_type != 'summary') {
                    _colitem["sortable"] = true;
                    delete _colitem["slots"].default;
                }
                _ux_grid_columns.push(_colitem);
            }
            let arr_collist = [];
            window.colCount=0;
          if (_this.numerics_fieldlist.length > 0) {
                if (_this.cols_fieldList.length > 0 && _this.report_type == "summary") {
                //if ( _this.report_type == "summary") {
                    arr_collist = _this.buildCols(0, '');
                    _ux_grid_columns = [..._ux_grid_columns, ...arr_collist];
                }
                else if (_this.cols_fieldList.length == 0 && _this.report_type == "summary"){
                    _ux_grid_columns = [..._ux_grid_columns, ..._this.getSubTotalHeads('','',0)];
                }
            }
            //计算其中一列最后一级的节点总数
            let nodeCount = 1;
            const fun_getMaxLeave = (obj_column) => {
                let obj_children = obj_column.children;
                if (obj_children != undefined && obj_children.length > 0) {
                    fun_getMaxLeave(obj_column.children[0]);
                    nodeCount = nodeCount * obj_children.length;
                }
            }

            if (arr_collist.length > 0) {
                fun_getMaxLeave(arr_collist[0]);
            }
            //所有列的节点总数
            let nodeCount_all = nodeCount * arr_collist.length;

            nodeCount_all = nodeCount_all == 0 ? _this.numerics_fieldlist.length + 1 : nodeCount_all;
            if (_this.report_type == "summary" && _this.numerics_fieldlist.length > 0 && nodeCount_all > _this.numerics_fieldlist.length &&_this.elradio_isShow_ColAlltotal=="true" && _this.cols_fieldList.length > 0 ) {
                _ux_grid_columns.push({
                    title: '合计',
                    align: 'center',
                    resizable: true,
                    level:0,
                    children: _this.getSubTotalHeads('','',1)
                });
            }
            _this.ux_grid_columns = _ux_grid_columns;
        },
        cellDataToHtml(row,column,h,cell_type,colname){
            let col_name=colname;
            if(this.elradio_contentType=='tree'&& cell_type!="numerics" && this.rows_fieldList[row.level]!=undefined ){
                col_name=this.rows_fieldList[row.level].name
            }
            let cellValue = row[colname];
            if(cell_type=="numerics" ){
                if (cellValue && !isNaN(Number(cellValue))) {
                    cellValue=this.format_number(cellValue);
                }
                else if(cellValue==undefined || cellValue==0 ) {
                    cellValue='-';
                }
            }
            let cell_style={};
            let item_cell_style=row[col_name+"_cell_style"];
            let item_linkUrl=row[col_name+"_linkUrl"];
            let item_linkTarget=row[col_name+"_linkTarget"];
            if( item_linkUrl!=null &&  item_linkUrl.trim().length>1 ){
                cell_style["cursor"]="pointer";
                cell_style["color"]="#1116e7";
                cell_style["text-decoration"]="underline";
            }
            if(item_cell_style!=undefined){
                cell_style={...cell_style,...item_cell_style};
            }
            let temp_obj= {
                style: cell_style,
            };
            if( item_linkUrl!=null &&  item_linkUrl.trim().length>1 ){
                temp_obj["on"]={
                    click:(event)=>this.handle_click_cellLink(event)
                }
                temp_obj["attrs"]={
                    "item_linkUrl":item_linkUrl,
                    "item_linkTarget":item_linkTarget
                }
            }
            return [
                h('div',temp_obj, cellValue)
            ]
        },
        handle_filterChange(column_obj) {
            for (let item of column_obj.filters) {
                this.filter_fieldlist[item.property] = item.values;
            }
        },
        buildCols(index, col_value) {
            if(window.colCount>200){
                throw '当前表格的列数上限为200列数,请重新选择字段！'
            }
            let colname = this.cols_fieldList[index].name;
            let find_column = this.filter_fieldlist[colname] ;
            let arr_filters_colname = [];
            if (find_column != undefined) {
                arr_filters_colname = find_column;
            }
            let arr_values =[];
            if(index==0){
                arr_values = this.getColumnValues(colname);
            }
            else{
                try{
                    let arr_colval=col_value.split(',');
                    let datalist=this.rsp_datalist;
                    for(let i=0;i<arr_colval.length;i++){
                        let key = this.cols_fieldList[i].name;
                        let val=arr_colval[i];
                        datalist=datalist.filter(ite=>ite[key]==val);
                    }
                    arr_values=[...new Set( datalist.map(ite=>ite[colname]) )]
                }
                catch(err){
                    arr_values = this.getColumnValues(colname);
                }
            }

                if(arr_filters_colname.length>0){
                    arr_values=arr_values.filter(ite=>arr_filters_colname.includes(ite) )
                }
                let opt_order=this.orderby_fields[colname];
                if(opt_order=='asc'){
                    arr_values = arr_values.sort((a,b)=>{return (a+'').localeCompare(b+'') });
                }
                else if(opt_order=='desc'){
                    arr_values = arr_values.sort((a,b)=>{return (b+'').localeCompare(a+'') });
                }

            let column_list = [];
            for (let item_title of arr_values) {
                item_title=item_title==undefined?"":item_title;
                col_value=col_value==undefined?"":col_value;
                let titleinfo = col_value == '' ? item_title : col_value+','+item_title ;
                for (let item of this.numerics_fieldlist) {
                    this.groupNumerics_fieldlist.push(titleinfo+","+item.name);
                }
                let childrens=[];
                if(index + 1 < this.cols_fieldList.length)  {
                    childrens=this.buildCols(index + 1, titleinfo);
                }
                else{
                    childrens=this.getSubTotalHeads(col_value.replace(/,/g, '') + item_title,col_value,index+1);
                }
               
                let column_obj = {
                    title: item_title,
                    align: 'center',
                    resizable: true,
                    children:childrens,
                    level:index
                };
                if( this.elradio_isShow_ColSubtotal=='true' && index+1< this.cols_fieldList.length && childrens.length>1 ){
                    column_obj.children.push({
                        title: item_title+'小计',
                        align: 'center',
                        resizable: true,
                        minWidth:120,
                        style:{
                            color:'#0b46f5'
                        },
                        children:this.getSubTotalHeads(col_value.replace(/,/g, '') + item_title,col_value,index+2),
                        level:index+1
                    });
                }
                column_list.push(column_obj);
                window.colCount=window.colCount==undefined?0:window.colCount;
                window.colCount++;
                
            }
            return column_list;
        },
        getSubTotalHeads(title,title_old,level) {
            let children_obj = [];
            for (let item of this.numerics_fieldlist) {
                let colname =title+item.name;
                let col_name2 =title_old+item.name ;
                children_obj.push({
                    minWidth: 120,
                    title: item.name,
                    resizable: true,
                    align: 'center',
                    showHeaderOverflow: 'tooltip',
                    field: colname,
                    level:level,
                    slots: {
                        default: ({ row, column }, h) => {
                            return this.cellDataToHtml(row,column,h,"numerics",colname);
                        }
                    }
                });
                this.ux_grid_header.push(item.name);
                this.arr_filter_vals.push(colname);
                if( this.elradio_isShow_ColSubtotal=='true' && title_old!='' && title_old!=null && !this.groupNumerics_fieldlist.includes(col_name2) ){
                    this.groupNumerics_fieldlist.push(col_name2);
                }
            }
            return children_obj;
        },
        handle_click_cellLink(event){
            const attributes = event.target.attributes;
            if(attributes.item_linkurl!=undefined){
                let item_linkurl=attributes.item_linkurl.value
                let item_linktarget=attributes.item_linktarget.value
                if(item_linkurl){
                    if(item_linktarget=="_blank"){
                        window.open(item_linkurl, '_blank');
                    }
                    else if(item_linktarget=="_self"){
                        window.location.href=item_linkurl;
                    }
                    else{
                    this.iframe_linkUrl=item_linkurl;
                    this.dialog_TargetWindow=true;
                    }
                }
            }
        },
        format_number(number){
            let numObj=parseFloat((number*1).toFixed(this.ipt_decimalPlaces));
            if(this.elradio_separator=='true'){
                numObj=new Intl.NumberFormat('en-US').format(  numObj  );
            }
            return numObj;
        },
        row_className(row, index) {
            let rtn_cls="";
            if (this.elradio_contentType == 'tree') {
                let classname = "";
                switch (row.level) {
                    case 0:
                        classname = 'cls_levelnode0'
                        break;
                    case 1:
                        classname = 'cls_levelnode1'
                        break;
                    case 2:
                        classname = 'cls_levelnode2'
                        break;
                }
                rtn_cls+=' '+classname;
            }
            else if (this.report_type == 'summary') {
                if (row['row']['type'] == 'total') {
                    rtn_cls+= " cls_subtotal_row";
                }
            }
            if(window.tableRowCount%2==1){
                rtn_cls+= " cls_defaultBg_row";
            }
            window.tableRowCount++;
            return rtn_cls;
        },
        cell_className(row, column, rowIndex, columnIndex){
            let rtn_cls="";
            let colidx=row.$columnIndex==undefined?0:row.$columnIndex;
            if (this.report_type == 'summary' ){
                let  colCount=this.rows_fieldList.length;
                if(this.elradio_contentType=='tree'){
                    colCount=1;
                }
                if(colidx< colCount ){
                    rtn_cls+=' cls_defaultBg_cell ';
                }
            }
            return rtn_cls;
        },

        setCookie(name, value, days) {
            name=encodeURIComponent( this.rpt_des_name+'_cus_umytable') +name;
            // let expires = "";
            // if (days) {
            //     let date = new Date();
            //     date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            //     expires = "; expires=" + date.toUTCString();
            // }
            // document.cookie = name + "=" + (value || "") + expires + "; path=/";
            localStorage.setItem(name,value);
        },
        getCookie(name) {
            name=encodeURIComponent( this.rpt_des_name+'_cus_umytable') +name;
            // let nameEQ = name + "=";
            // let ca = document.cookie.split(';');
            // for (let i = 0; i < ca.length; i++) {
            //     let c = ca[i];
            //     while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            //     if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            // }
            // return null;
            return localStorage.getItem(name);
        },
        getUrlParamValue(parname) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if ( ( pair[0]+'').toLowerCase() == parname.toLowerCase()) {
                    return  ( pair[1] );
                }
            }
            return '';
        },
        handle_summary({ columns, data }) {
            const _this = this, totalRow = [];
            if( _this.elradio_contentType=='grid' && _this.report_type=='summary' ){
                 data=data.filter(item=>item["type"]!='total');
            }
            columns.forEach((column, columnIndex) => {
                if (columnIndex === 0) {
                    totalRow.push('合计');
                }
                else {
                    const values = data.map(item => Number(item[column.property]));
                    if (!values.every(value => isNaN(value)) && (this.rows_fieldList.find(val => val.name == column.property) == undefined )) {
                        totalRow[columnIndex] = values.reduce((acc, itemObj) => {
                            const value = Number(itemObj);
                            if (!isNaN(value)) {
                                return (acc*1 + itemObj*1).toFixed(8);
                            }
                            else {
                                return acc;
                            }
                        }, 0);
                        totalRow[columnIndex] = _this.format_number ( totalRow[columnIndex] );
                    }
                }
            });
            return [totalRow];
        },
        handle_summary_detail({ columns, data }){
            const _this = this, totalRow = [];
            columns.forEach((column, columnIndex) => {
                if (columnIndex === 0) {
                    totalRow.push('合计');
                }
                else {
                    const values = data.map(item => Number(item[column.property]));
                    if (!values.every(value => isNaN(value)) && _this.numerics_fieldlist.map(ite=>ite.name).includes(column.property) ) {
                        totalRow[columnIndex] = values.reduce((acc, itemObj) => {
                            const value = Number(itemObj);
                            if (!isNaN(value)) {
                                return  (acc*1 + itemObj*1).toFixed(8);
                            }
                            else {
                                return acc;
                            }
                        }, 0);
                        totalRow[columnIndex] = _this.format_number( totalRow[columnIndex] );
                    }
                }
            });
            return [totalRow];
        },
        getOrderByinfo(val, row, columnIndex) {
            for (let i = 0; i <= columnIndex; i++) {
                let _name = this.rows_fieldList[i].name;
                if (val[_name] != row[_name])
                    return false;
            }
            return true;
        },
        getmapdata(mapdata,parentNode){
            let node_level=0
            if(parentNode!=undefined){
                node_level=parentNode.level+1;
            }
            let datas=[];
            let field_name=this.rows_fieldList[node_level].name;
            let opt_order=this.orderby_fields[field_name];
            let sortedMap=new Map();
            if(this.orderby_fields!={}){
                let field_number=null;
                if(this.orderby_fields["isNumberField"]==true){
                    //如果是数值型字段排序
                    field_number=this.numerics_fieldlist.find( ite=> Object.keys(this.orderby_fields).includes(ite.name) );
                    if(field_number!=undefined){
                        opt_order=this.orderby_fields[field_number.name];
                    }
                }
                if(opt_order=='asc'){
                    let sortedArray =Array.from(mapdata);
                    sortedArray=sortedArray.sort((a, b) => { 
                        if(field_number!=undefined){
                            return a[1][field_number.name]-b[1][field_number.name];
                        } 
                        else{ 
                            return (a[0]+'').localeCompare(b[0]+'');
                        }
                    } );
                    sortedMap = new Map(sortedArray);
                }
                else if(opt_order=='desc'){
                    let sortedArray =Array.from(mapdata);
                    sortedArray=sortedArray.sort((a, b) => { 
                        if(field_number!=undefined){
                            return b[1][field_number.name]-a[1][field_number.name];
                        } 
                        else{ 
                            return (b[0]+'').localeCompare(a[0]+'');
                        }
                    } );
                    sortedMap = new Map(sortedArray);
                }
                else{
                    sortedMap=mapdata;
                }
            }
            else{
                sortedMap=mapdata;
            }
            sortedMap.forEach((item)=>{
                let tempObj={...item};
                delete tempObj.children;
                if(item.children.size>0){
                    tempObj.children=this.getmapdata(item.children,item);
                }
                if(this.conditionFields_execute_Aggregate.length>0){
                    tempObj=this.bindConditionField_partition(tempObj,this.conditionFields_execute_Aggregate);
                }
                datas.push(tempObj);
                if (tempObj.level + 1 < this.expandTreelevel) {
                    this.expandTreeNodes.push(tempObj);
                }
            });
            return datas
        },
        getmapdata_grid(mapdata,parentNode){
            let max_level=this.rows_fieldList.length-1;
            let node_level=0
            if(parentNode!=undefined){
                node_level=parentNode.level+1;
            }
            let field_name=this.rows_fieldList[node_level].name;
            let opt_order=this.orderby_fields[field_name];
            let sortedMap=new Map();
            if(this.orderby_fields!={}){
                let field_number=null;
                if(this.orderby_fields["isNumberField"]==true){
                    //如果是数值型字段排序
                    field_number=this.numerics_fieldlist.find( ite=> Object.keys(this.orderby_fields).includes(ite.name) );
                    if(field_number!=undefined){
                        opt_order=this.orderby_fields[field_number.name];
                    }
                }
                if(opt_order=='asc'){
                    let sortedArray =Array.from(mapdata);
                    sortedArray=sortedArray.sort((a, b) => { 
                        if(field_number!=undefined){
                            return a[1][field_number.name]-b[1][field_number.name];
                        } 
                        else{ 
                            return (a[0]+'').localeCompare(b[0]+'');
                        }
                    } );
                    sortedMap = new Map(sortedArray);
                }
                else if(opt_order=='desc'){
                    let sortedArray =Array.from(mapdata);
                    sortedArray=sortedArray.sort((a, b) => { 
                        if(field_number!=undefined){
                            return b[1][field_number.name]-a[1][field_number.name];
                        } 
                        else{ 
                            return (b[0]+'').localeCompare(a[0]+'');
                        }
                    } );
                    sortedMap = new Map(sortedArray);
                }
                else{
                    sortedMap=mapdata;
                }
            }
            else{
                sortedMap=mapdata;
            }
            sortedMap.forEach((item)=>{
                let level=item.level;
                let tempObj={...item};
                delete tempObj.children;
                if(item.children.size>0){
                    tempObj.children=this.getmapdata_grid(item.children,item);
                }
                if(max_level==level && level>0){
                    parentNode["maxNodeCount"]+=1;
                }
                else if(parentNode!=undefined){
                    parentNode["maxNodeCount"]+=item["maxNodeCount"];
                }

                /******************************************************************/
                let children_obj=item.children;
                let style_val=this.elradio_rowSubtotalStyle=="simple"?1:0;
                if(level<this.ipt_rowSubtotal_numberColumns && children_obj.size>0 ){
                    let maxNodeCount=item["maxNodeCount"];
                    if(this.elradio_rowSubtotalStyle!="none"){
                        //在数据集合中追加小计行
                        //if( ( children_obj.size>style_val || ( level==0 && maxNodeCount>1 && this.ipt_rowSubtotal_numberColumns==1 ) )   && level<this.ipt_rowSubtotal_numberColumns ){
                        if( ( children_obj.size>style_val || (  maxNodeCount>1 && level== this.ipt_rowSubtotal_numberColumns-1  ) )   && level<this.ipt_rowSubtotal_numberColumns ){
                            let name=this.rows_fieldList[level+1].name
                            item[name]=item.key+'小计';
                            item['type'] = 'total'
                            if(level>0){
                                parentNode["maxNodeCount"]+=1;
                            }
                            maxNodeCount+=1;
                            if(this.conditionFields_execute_Aggregate.length>0){
                                item=this.bindConditionField_partition(item,this.conditionFields_execute_Aggregate);
                            }
                            this.ux_grid_datas.push(item);
                            //temp_datalist.push(item);
                        }
                    }
                    if(maxNodeCount>1){
                        //let row_index=this.ux_grid_datas.length+temp_datalist.length-maxNodeCount;
                        let row_index=this.ux_grid_datas.length-maxNodeCount;
                        let marge_temp={
                            row: row_index,
                            col:level,
                            rowspan:maxNodeCount,
                            colspan:1,
                            keyname:item['key']
                        }
                        this.cells_merge.push(marge_temp)
                    }
                }
                else if(children_obj.size==0) {
                    let row0_obj=item.datalist[0];
                    let arr_style_val=Object.keys(row0_obj).filter(ite=>ite.indexOf('_cell_style')>-1 || ite.indexOf('_linkUrl')>-1 || ite.indexOf('_linkTarget')>-1 )
                    for(let item_style_key of arr_style_val){
                        item[item_style_key]=row0_obj[item_style_key];
                    }  
                   
                    if(this.conditionFields_execute_Aggregate.length>0){
                        item=this.bindConditionField_partition(item,this.conditionFields_execute_Aggregate);
                    }
                    this.ux_grid_datas.push(item);
                    //temp_datalist.push(item);
                }
                /******************************************************************/
            });
            // for(let item of temp_datalist){
            //     this.ux_grid_datas.push(item);
            // }
        }
        ,getMarge_cells(grid_datas){
            let _this=this;
            // let cells_merge=[];
            let arr_field=_this.rows_fieldList.map(ite=>ite.name);
            //let col_len=_this.rows_fieldList.length-1;
            let col_len=_this.ipt_rowSubtotal_numberColumns;
            let row_len=grid_datas.length;
            for(let col_index=0;col_index<col_len;col_index++){
                let start_index=0;
                let count=1;
                for( let row_index=0;row_index< row_len;row_index++ ){
                    let now_item=grid_datas[row_index];
                    let next_item=grid_datas[row_index+1]
                    let now_cellVal="";
                    let next_cellVal="";
                    for(let i=0;i<=col_index;i++){
                        now_cellVal+=now_item[arr_field[i]];
                        if(next_item!=undefined){
                            next_cellVal+=next_item[arr_field[i]];
                        }
                        else{
                            next_cellVal=null;
                        }
                    }
                    //表格性能问题尽量不要超过15个跨行
                    //if(now_cellVal==next_cellVal && count<=15 ){
                    if(now_cellVal==next_cellVal  ){
                        count++;
                    }
                    else{
                        if(count>1){
                            let marge_temp={
                                row: start_index,
                                col:col_index,
                                rowspan:count,
                                colspan:1,
                                keyname:now_cellVal
                            }
                            this.cells_merge.push(marge_temp)
                        }
                        start_index+=count;
                        count=1;
                    }
                }
            }
        }
        ,
        buildTreeData3(datalist){
            let _this=this;
            let arr_field=_this.rows_fieldList.map(ite=>ite.name);
            let treeMap=new Map();
            for(let obj of datalist){
                let findpathname="treeMap";
                let findchildrenObj="treeMap";
                for(let index=0;index<arr_field.length;index++){
                    let name=arr_field[index];
                    let children_Obj=new Map();
                    let key=obj[name]+"";
                    key=key.replace(/['"\n\t\r]/g,"");
                    if(index>0){
                        findchildrenObj=findpathname+".children";
                    }
                    if(index==0){
                        findpathname+=".get('"+key+"')"
                    }
                    else{
                        let temp_value=obj[arr_field[index]]+"";
                        temp_value=temp_value.replace(/['"\n\t\r]/g,"");
                        findpathname+=".children.get('"+temp_value+"')"
                    }
                    //console.log(findpathname)
                    if (eval(findpathname)==undefined ) {
                        let tempObj={
                            childField:arr_field[index+1]
                            ,children:children_Obj
                            ,datalist:[obj] 
                            ,level:index
                            ,fieldName:name
                            ,fieldValue:key
                        } 
                        let nodename= "tree_nodeName";
                        tempObj[nodename]=key;
                        tempObj["key"]=key;
                        tempObj["maxNodeCount"]=0;
                        let cell_style_name=name+'_cell_style'
                        let cell_linkUrl=name+'_linkUrl'
                        let cell_linkTarget=name+'_linkTarget'
                        if(obj[cell_style_name]!=undefined){
                            tempObj[cell_style_name]=obj[cell_style_name];
                        }
                        if(obj[cell_linkUrl]!=undefined){
                            tempObj[cell_linkUrl]=obj[cell_linkUrl];
                        }
                        if(obj[cell_linkTarget]!=undefined){
                            tempObj[cell_linkTarget]=obj[cell_linkTarget];
                        }
                        let join_name= arr_field.join('/');
                        let join_value="";
                        for(let i=0;i<=index;i++){
                            let t_name=arr_field[i];
                            let t_value=obj[t_name];
                            join_value=join_value+t_value+','
                            tempObj[t_name]=t_value;
                        }
                        tempObj["join_value"]=join_value;
                        tempObj["join_name"]=join_name;
                        tempObj[join_name]=key;
                        for(let reitem of _this.groupNumerics_list){
                            let total_num=0;
                            let isok=true;
                            let cname=reitem.cname;
                            let arr_keyvals=reitem.filters;
                            Object.keys(arr_keyvals).every((keyname, idx) => {
                                if(obj[keyname]!=arr_keyvals[keyname]){
                                    isok=false;
                                    return false;
                                }
                                return true;
                            });
                            total_num=isok==true?obj[reitem.total_field]:0;
                            tempObj[cname]=total_num;
                        }
                        eval(findchildrenObj).set(key,tempObj);
                    }
                    else{
                        let data=eval(findpathname);
                        data.datalist.push(obj);
                        for(let reitem of _this.groupNumerics_list){
                            let total_num=0;
                            let isok=true;
                            let cname=reitem.cname;
                            let arr_keyvals=reitem.filters;
                            Object.keys(arr_keyvals).every((keyname, idx) => {
                                if(obj[keyname]!=arr_keyvals[keyname]){
                                    isok=false;
                                    return false;
                                }
                                return true;
                            });
                            total_num=isok==true?obj[reitem.total_field]:0;
                            data[cname]=data[cname]*1+total_num*1;
                        }
                        eval(findchildrenObj).set(key,data);
                    }
                }
            }
            return treeMap;
        },

          
        handle_rowsTagClose(tagtext) {
            let _this = this;
            const fieldObj = _this.rows_fieldList.find(val => val.name == tagtext);
            _this.hide_fieldslist.push(fieldObj);
            const idx = _this.rows_fieldList.indexOf(fieldObj);
            _this.rows_fieldList.splice(idx, 1);
            this.handle_resetALL();
        },
        handle_colsTagClose(tagtext) {
            let _this = this;
            const fieldObj = _this.cols_fieldList.find(val => val.name == tagtext);
            _this.hide_fieldslist.push(fieldObj);
            const idx = _this.cols_fieldList.indexOf(fieldObj);
            _this.cols_fieldList.splice(idx, 1);
            this.handle_resetALL();
        },
        handle_numericsTagClose(tagtext) {
            let _this = this;
            const fieldObj = _this.numerics_fieldlist.find(val => val.name == tagtext);
            _this.hide_fieldslist.push(fieldObj);
            const idx = _this.numerics_fieldlist.indexOf(fieldObj);
            _this.numerics_fieldlist.splice(idx, 1);
            this.handle_resetALL();
        },
        handle_darg_update(e) {
            this.initTable();
        },
        handle_darg_add(e) {
            this.handle_resetALL();
        },

       
        handle_radiochange_tableType(sel_val) {
            if (sel_val == 'summary') {
                this.report_type = 'summary';
                this.isShow_ColSubtotal=true;
            }
            else {
                this.report_type = 'detail';
                this.elradio_contentType = 'grid';
                this.isShow_ColSubtotal=false;
                this.isShow_treelevel=false;
                this.ux_grid_datas=[];
            }
            this.handle_resetALL();
        },
        handle_radiochange_separator(){
            this.initTable();
        },
        handle_iptChange_decimalPlaces(){
            this.initTable();
        },
        handle_radiochange_autoFrozenCols(sel_val) {
            this.isShow_frozenCols = !this.isShow_frozenCols
            this.initTable();
        }
        , handle_radiochange_contentType(sel_val) {
            if (sel_val == 'tree') {
                this.elradio_tableType = 'summary'
                this.report_type = 'summary';
                this.isShow_treelevel = true;
            }
            else {
                this.isShow_treelevel = false;
            }
            this.initTable();
        }
        ,
        handle_isshowDrag() {
            this.isShow_drag = !this.isShow_drag;
            if (this.isShow_drag) {
                this.elbtn_type = 'plain';
                this.btn_setingname = '隐藏自定义'
            }
            else {
                this.elbtn_type = 'primary';
                this.btn_setingname = '自定义'

            }
            setTimeout(() => {
                this.handle_sizeChange()
            }, 500);
        },
       
        handle_sizeChange(objVal) {
            if(objVal!=undefined && objVal!=null && objVal.type==undefined){
                this.size_style = objVal;
            }
            if (this.elradio_size == 'mini') {
                this.size_height = 16;
            }
            else if (this.elradio_size == 'medium') {
                this.size_height = 26;
            }
            else {
                this.size_height = 20;
            }
             
            this.proWidth=window.dom_width;
            this.proHeight_detail=window.innerHeight*0.7
            this.proHeight =window.dom_height - document.getElementById("drag_box").offsetHeight-123  - this.size_height;
        },
        handle_Tagclick(tagtext, cellType) {
            if (this.sel_isclick == false) {
                return;
            }
            this.sel_iptSearch="";
            this.sel_isclick = false;
            this.sel_tagtext = tagtext;
            let lblIndex = this.sel_columns.findIndex(item => item.label == tagtext && item.index != undefined);
            let column = {};
            column.cellType = cellType;
            if (lblIndex < 1) {
                let arr_filters = this.getColumnValues(tagtext).sort().sort((a, b) => { return a - b });
                column.label = tagtext;
                column.title = tagtext;
                column.index = this.sel_columns.length
                column.filters = [];
                for (let item of arr_filters) {
                    let arr_filter_values = this.filter_fieldlist[tagtext];
                    let isExists = arr_filter_values != undefined && arr_filter_values.includes(item) ? true : false;
                    column.filters.push(
                        {
                            label: item,
                            value: item,
                            checked: isExists,
                        }
                    );
                }
                this.sel_columns.push(column);
                this.sel_colIndex = column.index;
            } else {
                column = this.sel_columns[lblIndex];
                if (column.filters_bak != undefined && column.filters_bak.length != column.filters.length) {
                    for (let t_ = 0; t_ < column.filters_bak.length; t_++) {
                        if (!column.filters.find(item => item.label == column.filters_bak[t_])) {
                            column.filters[t_] = column.filters_bak[t_];
                        }
                    }
                    delete column.filters_bak;
                }

                this.sel_colIndex = lblIndex;
            }
            let checkedlen = column.filters.filter(val => val.checked ).length
            if (checkedlen > 0) {
                this.sel_btn_qy_disabled = false
                this.sel_btn_reset_disabled = false
                this.sel_isIndeterminate = true;
            }
            else {
                this.sel_btn_qy_disabled = true
                this.sel_btn_reset_disabled = true
                this.sel_isIndeterminate = false;
            }

            this.divElement = document.getElementById('elementsContainer');

            this.sel_divIsShow = true;

            document.addEventListener('click', this.handle_startPostion);

            setTimeout(() => {
                document.addEventListener('click', this.handle_ListenerClick);
            }, 300);

        }
        , handle_ListenerClick(event) {
            if (this.divElement != null && !this.divElement.contains(event.target)) {
                this.sel_divIsShow = false;
                this.sel_isclick = true;
                document.removeEventListener('click', this.handle_ListenerClick);
            }
        }
        , handle_startPostion(event) {
            this.divElement.style.top = event.clientY + 10 + 'px'
            this.divElement.style.left = event.clientX - 5 + 'px'
            document.removeEventListener('click', this.handle_startPostion);
        }
        , handle_checkAllChange(val) {
            let _this = this
            let column = this.sel_columns[this.sel_colIndex];
            column.filters.map(item => {
                _this.$set(item, 'checked', val);
            });
            if (val == true) {
                this.sel_btn_qy_disabled = false
                this.sel_btn_reset_disabled = false
            }
            else {
                this.sel_btn_qy_disabled = true
                this.sel_btn_reset_disabled = true
                this.sel_isIndeterminate = false;
            }
        }
        , handle_selChangeItem(val) {
            let column = this.sel_columns[this.sel_colIndex];
             
            let checkedlen = column.filters.filter(val => val.checked).length
            let alllen = column.filters.length;
            this.sel_isIndeterminate = checkedlen > 0 && checkedlen !== alllen

            if (checkedlen > 0) {
                this.sel_btn_qy_disabled = false
                this.sel_btn_reset_disabled = false
            }
            else {
                this.sel_btn_qy_disabled = true
                this.sel_btn_reset_disabled = true
            }
        }
        , handle_resetvalue() {
            let column = this.sel_columns[this.sel_colIndex];
            column.filters.map((item, index) => {
                item.checked = false;
            });
            this.sel_btn_qy_disabled = true
            this.sel_btn_reset_disabled = true
            this.sel_isIndeterminate = false;
            // this.orderby_fields={};
            this.handle_filterValue();
        }
        , handle_resetALL() {
            this.filter_fieldlist = {};
            this.mergedDataMap.clear();
            for(let column_obj of this.sel_columns){
                column_obj.filters.map((item, index) => {
                    item.checked = false;
                });
            }
            this.sel_btn_qy_disabled = true
            this.sel_btn_reset_disabled = true
            this.sel_isIndeterminate = false;
            // this.orderby_fields={};
            this.initTable();
        }
        , handle_filterValue() {
            let _this = this;
            let column = _this.sel_columns[_this.sel_colIndex];
            let column_obj = {};
            column_obj.property = column.label;
            column_obj.datas = [];
            column_obj.values = [];
            column_obj.filters = [];
            for (let item_col of _this.sel_columns) {
                let temp_obj = {};
                temp_obj.property = item_col.label;
                temp_obj.values = item_col.filters.filter(t => t.checked).map(o => o.label);
                temp_obj.datas = [];
                column_obj.filters.push(temp_obj);
            }
            for (let item of column_obj.filters) {
                if(item.property!=undefined && item.property.trim()!=''){
                    this.filter_fieldlist[item.property] = item.values;
                 }
            }
            _this.initTable();
        }, handle_iptChange_treeLevel() {
            this.initTable();
        }
        , handle_iptChange_frozenCols() {
            this.initTable();
        },
        handle_inputchangeValue(event) {
            let column = this.sel_columns[this.sel_colIndex];
            let inputValue2 = this.sel_iptSearch;
            let val = !this.sel_iptSearch? null : this.sel_iptSearch;
            column.filters_bak = column.filters_bak == undefined ? column.filters : column.filters_bak;
            if (!!val && val != "") {
                // column.filters = column.filters.filter(item => item.label.includes(val) || pinyin.getFullChars(item.label).toLowerCase().includes(val.toLowerCase()));
                column.filters = column.filters.filter(item => item.label.toLowerCase().includes(val.toLowerCase())) 
            }
            else {
                if (column.filters_bak != undefined && column.filters_bak.length != column.filters.length) {
                    for (let t_ = 0; t_ < column.filters_bak.length; t_++) {
                        if (!column.filters.find(item => item.label == column.filters_bak[t_])) {
                            column.filters[t_] = column.filters_bak[t_];
                            this.$set(column.filters, t_, column.filters[t_]);
                        }
                    }
                    delete column.filters_bak;
                }
            }
        },
        handle_click_saveTemplate() {
            let _this = this;
            let template_name = _this.ipt_templateName.trim();
            if (template_name == null || template_name == '') {
                Message.error('自定义名称不能为空!');
                return
            }
            else if(template_name.trim()=='系统默认'){
                Message.error('不能操作系统默认!');
                return
            }
            else {
                let ed_tname=encodeURIComponent(template_name);
                let grid_config = _this.getGrid_config();
                _this.setCookie(ed_tname, encodeURIComponent(JSON.stringify(grid_config)), 3650);
                let index = _this.custom_templates.map(item => item.label).indexOf(template_name);
                if (index > -1) {
                    _this.custom_templates[index].grid_config = grid_config;
                    Message.success('自定义偏好【' + template_name + '】修改成功!');
                }
                else {
                    _this.custom_templates.push({
                        label: template_name,
                        value: template_name,
                        grid_config: grid_config
                    });
                    Message.success('自定义偏好【' + template_name + '】保存成功!');
                    _this.setCookie('sel_templateName',ed_tname,3650);
                }
                _this.sel_templateName = template_name;
                setTimeout(() => {
                     _this.ipt_templateName = '';
                }, 200);

            }
        },
        getGrid_config(){
            let _this=this;
            let grid_config = {
                report_type: _this.report_type
                , elradio_contentType: _this.elradio_contentType
                , expandTreelevel: _this.expandTreelevel
                , elradio_autoFrozenCols: _this.elradio_autoFrozenCols
                , frozenCols: _this.frozenCols
                , rows_fieldList: _this.rows_fieldList
                , cols_fieldList: _this.cols_fieldList
                , numerics_fieldlist: _this.numerics_fieldlist
                , hide_fieldslist: _this.hide_fieldslist
                , size_style: _this.size_style
                , isShow_frozenCols: _this.isShow_frozenCols
                , isShow_treelevel: _this.isShow_treelevel
                ,isShow_ColSubtotal: _this.isShow_ColSubtotal
                ,elradio_isShow_ColSubtotal : _this.elradio_isShow_ColSubtotal
                ,elradio_rowSubtotalStyle : _this.elradio_rowSubtotalStyle
                ,ipt_rowSubtotal_numberColumns:_this.ipt_rowSubtotal_numberColumns
                ,orderby_fields:_this.orderby_fields
                ,conditionFields_list:_this.conditionFields_list
                ,elradio_isShow_ColAlltotal:_this.elradio_isShow_ColAlltotal
                ,elradio_separator:_this.elradio_separator
                ,ipt_decimalPlaces:_this.ipt_decimalPlaces
            }
            return grid_config;
        }
        ,
        handle_templateItemChange(sel_val) {
            let _this = this;
            if(sel_val!=undefined){
                _this.ipt_templateName=sel_val;
                _this.sel_templateName=sel_val;
            }
          
            let teamplate_obj = _this.custom_templates.find(item => item.label == _this.sel_templateName);
            if (teamplate_obj == null || teamplate_obj.grid_config == undefined) {
                _this.sel_templateName='系统默认'
                this.handle_resetALL();
                return
            }
            let grid_config = teamplate_obj.grid_config;
            _this.report_type = grid_config.report_type;
            _this.elradio_tableType=grid_config.report_type;
            _this.elradio_contentType = grid_config.elradio_contentType;
            _this.expandTreelevel = grid_config.expandTreelevel;
            _this.elradio_autoFrozenCols = grid_config.elradio_autoFrozenCols;
            _this.frozenCols = grid_config.frozenCols;
            _this.rows_fieldList = grid_config.rows_fieldList;
            _this.cols_fieldList = grid_config.cols_fieldList;
            _this.numerics_fieldlist = grid_config.numerics_fieldlist;
            _this.hide_fieldslist = grid_config.hide_fieldslist;
            _this.size_style = grid_config.size_style;
            _this.elradio_size= grid_config.size_style;
            _this.isShow_frozenCols = grid_config.isShow_frozenCols
            _this.isShow_treelevel = grid_config.isShow_treelevel
            _this.isShow_ColSubtotal = grid_config.isShow_ColSubtotal
            _this.elradio_isShow_ColSubtotal = grid_config.elradio_isShow_ColSubtotal
            _this.elradio_rowSubtotalStyle = grid_config.elradio_rowSubtotalStyle
            _this.ipt_rowSubtotal_numberColumns=grid_config.ipt_rowSubtotal_numberColumns
            _this.orderby_fields=grid_config.orderby_fields
            _this.conditionFields_list=grid_config.conditionFields_list
            _this.elradio_isShow_ColAlltotal=grid_config.elradio_isShow_ColAlltotal
            _this.elradio_separator=grid_config.elradio_separator;
            _this.ipt_decimalPlaces=grid_config.ipt_decimalPlaces;
            _this.setCookie('sel_templateName',encodeURIComponent( _this.sel_templateName),3650);
            this.handle_resetALL();
        }
        , handle_delTemplateClick() {
            let _this = this;
            let template_name = _this.sel_templateName;

            if (_this.sel_templateName == '') {
                Message.error('当前没有选中的自定义！');
                return;
            }
            if (_this.sel_templateName == '系统默认'  ) {
                Message.error('不能操作系统默认！');
                return;
            }
            let index = _this.custom_templates.map(item => item.label).indexOf(template_name);
            if (index > -1) {
                if ( _this.custom_templates[index].cus_type == 'system'  ) {
                    Message.error('当前为系统预定义!');
                    // return;
                }
                MessageBox.confirm('此操作将删除【' + template_name + '】自定义, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.setCookie(encodeURIComponent(template_name), '', -1);
                    _this.custom_templates.splice(index, 1);
                    _this.sel_templateName = '系统默认';
                    setTimeout(() => {
                        _this.handle_templateItemChange();
                    }, 200);
                 
                    Message.success('删除成功!');
                }).catch(() => {
                    Message.info('已取消删除');
                });
            } else {
                Message.info('该自定义不存在,请刷新页面后再试!');
            }

        },
        handle_rowDBClick(row, column, event) {
            let _this=this;
            if(_this.report_type!='summary'){
                return;
            }
            _this.dialog_detailTable=true;
            let loading = this.$loading({
                lock: true,
                text: '数据加载中,请稍等...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.3)',
                color: "#000",
            })
            _this.ux_grid_columns_detail=[];
            let arr_columns = [..._this.rows_fieldList,..._this.cols_fieldList,..._this.hide_fieldslist,..._this.numerics_fieldlist];
            arr_columns.map(item=>item.name).forEach(keyName => {
                let colItem={
                    title: keyName,
                    field:keyName,
                    align: 'center',
                    resizable: true,
                    sortable: true,
                    minWidth:130
                }
                _this.ux_grid_columns_detail.push(colItem);
            });
           let detail_list=_this.rsp_datalist_initial;
            let join_value=(row["join_value"]+"");
            let arr_keys=(row["join_name"]+"").split('/');
            let arr_vals=join_value.substring(0,join_value.length-1) .split(',');
            for(let i=0;i<arr_vals.length;i++){
                let key=arr_keys[i];
                let val=arr_vals[i];
                // if(key!=undefined && val!=undefined && val!="null"){
                    detail_list=detail_list.filter(ite=>ite[key]+""==val);
                // }
            }
            

            let temp_title="";
            for(let i = 0; i < _this.rows_fieldList.length; i++) {
                if (i < 3) {
                    let item = _this.rows_fieldList[i];
                    if (row[item.name] != undefined && (row[item.name]+"").indexOf('小计') < 0 ) {
                        if (temp_title == "") {
                            temp_title = row[item.name];
                        }
                        else {
                           temp_title = temp_title + '/' + row[item.name];
                        }
                    }
                }
            }
            let col_property=column['property'];
            let col_title=column['title'];
            let split_name= "" ;
            if(_this.numerics_fieldlist.find(item=>item.name==col_title)!=undefined ){
                try {
                    let temp_subtotalcol=_this.groupNumerics_list.find(item=>item.cname==col_property);
                    let arr_filter= temp_subtotalcol.filters;
                    split_name=temp_subtotalcol.split_name.replace(/,/g,'/')
                    temp_title+="【"+split_name+"】"
                    Object.keys(arr_filter).forEach((keyname)=>{
                        detail_list=detail_list.filter(ite=>ite[keyname]==arr_filter[keyname] );
                    });
                } catch (error) {
                    let a=0;
                }
            }
            temp_title=_this.elradio_contentType=='tree'?row["tree_nodeName"]+temp_title:temp_title
             _this.detailTable_title=temp_title;
            setTimeout(() => {
                this.$refs.plxTable_detail.reloadData(detail_list);
                loading.close();
            }, 200);

            setTimeout(() => {
                loading.close();
            }, 8000);
        }
        ,handle_radiochange_isShowColSubtotal(){
            this.initTable();
        },
        handle_radiochange_isShow_ColAlltotal(){
            this.initTable();
        },
        handle_radiochange_rowSubtotalStyle(){
            this.initTable();
        },
        handle_ipt_rowSubtotal_numberColumns(){
            this.initTable();
        }
        ,
        handle_conditionFields_select(label){
            this.sel_conditionField_index =this.conditionFields_list_temp.findIndex(ite=>ite.label==label)
            this.sel_conditionField_index =this.conditionFields_list_temp.findIndex(ite=>ite.label==label)
            this.sel_conditionFields_obj=this.conditionFields_list_temp[ this.sel_conditionField_index];
            if(this.sel_conditionFields_obj.expression_list.length>0){
                this.handle_expression_select(this.sel_conditionFields_obj.expression_list[0].label);
            }
        },
        handle_expression_select(label){
            this.sel_expression_index=this.conditionFields_list_temp[this.sel_conditionField_index].expression_list.findIndex(ite=>ite.label==label);
            if(this.conditionFields_list_temp[this.sel_conditionField_index]!=undefined && this.conditionFields_list_temp[this.sel_conditionField_index].expression_list!=undefined)
            {
                this.sel_expression_obj=this.conditionFields_list_temp[this.sel_conditionField_index].expression_list[this.sel_expression_index];
            }
        }
        ,
        handle_conditionFields_add() {
            MessageBox.prompt('请输入字段名称', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/,
            inputErrorMessage: '字符串格式不正确'
            }).then(({ value }) => {
                let index =this.conditionFields_list_temp.findIndex(ite=>ite.label==value)
                if(index>-1){
                    Message.warning('字段【'+value+'】已存在!');
                }
                else{
                    let temp_obj={
                        label:value,
                        index:Math.random(),
                        expression_list:[{
                            label:"条件1",
                            condition_type:"if",
                            "isAggregate":"false",
                            expression:[{
                                id:0,
                                key_exp:"",
                                comparison:"",
                                value_exp:"",
                                previous_relation:""
                            }],
                            background_color:"",
                            font_color:"",
                            font_size:"",
                            newValue:"",
                            linkUrl:"",
                            linkTarget:"",
                    }],
                    }
                    this.conditionFields_list_temp.push(temp_obj);
                    Message.success('字段【'+value+'】添加成功!');
                }
           
            }).catch(() => {
                  
            });
        }
        ,
        handle_hidelableclick(){
            this.clickCount++;
            if(this.clickCount>=7){
                console.log("a/u_t_h/e/r:d/u/a/n/zl");
                this.clickCount=0;
            }
            setInterval(() => {
                this.clickCount=0;
            }, 15*1000);
        },
        handle_conditionFields_update() {
            MessageBox.prompt('请输入字段名称', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputValue:this.conditionFields_list_temp[this.sel_conditionField_index].label,
            inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/,
            inputErrorMessage: '字符串格式不正确'
            }).then(({ value }) => {
                this.conditionFields_list_temp[this.sel_conditionField_index].label=value;
                Message.success('字段【'+value+'】修改成功!');
            }).catch(() => {
                 
            });
        }
        ,
        handle_conditionFields_delete() {
            let label=this.conditionFields_list_temp[this.sel_conditionField_index].label;
            MessageBox.confirm('此操作将删除【' + label + '】字段, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.conditionFields_list_temp.splice(this.sel_conditionField_index,1);
                this.sel_conditionFields_obj.expression_list=[];
                this.sel_expression_obj={};
                Message.success('删除成功!');
            }).catch(() => {
                Message.info('已取消操作!');
            });
        }
        ,
        handle_expressionlist_add() {
            if(Object.keys( this.sel_conditionFields_obj).length<2){
                Message.warning('请先选择所属字段!');
                return;
            }
            MessageBox.prompt('请输入条件名称', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/,
            inputErrorMessage: '字符串格式不正确'
            }).then(({ value }) => {
                let index =this.sel_conditionFields_obj.expression_list.findIndex(ite=>ite.label==value)
                if(index>-1){
                    Message.warning('条件名称【'+value+'】已存在!');
                }
                else{
                    let temp_obj={
                            label:value,
                            condition_type:"if",
                            isAggregate:"false",
                            expression:[{
                                id:0,
                                key_exp:"",
                                comparison:"",
                                value_exp:"",
                                previous_relation:""
                            }],
                            background_color:"",
                            font_color:"",
                            font_size:"",
                            newValue:"",
                            linkUrl:"",
                            linkTarget:"",
                     }
                    this.sel_conditionFields_obj.expression_list.push(temp_obj);
                    Message.success('条件【'+value+'】添加成功!');
                }
           
            }).catch(() => {
                  
            });
        }
        ,handle_expressionlist_delete(){
            if(Object.keys( this.sel_conditionFields_obj).length<2){
                Message.warning('请先选择所属字段!');
                return;
            }
            let label=this.sel_expression_obj.label;
            MessageBox.confirm('此操作将删除【' + label + '】字段, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
               
                this.sel_conditionFields_obj.expression_list.splice(this.sel_expression_index,1);
                this.sel_expression_obj={};
                Message.success('删除成功!');
            }).catch(() => {
                Message.info('已取消操作!');
            });
        }
        ,handle_expression_insert(){
            let sel_expression=this.sel_expression_obj.expression;
            let max_id=0;
            for(let item of sel_expression){
                if(item.id>max_id){ 
                    max_id=item.id
                }
            }
            let temp_obj={
                "id":max_id+1,
                "key_exp":"",
                "comparison":"",
                "value_exp":"",
                "previous_relation":"and"
            }
            this.sel_expression_obj.expression.push(temp_obj);
        },
        handle_expression_obj_clear(){
            this.sel_expression_obj.expression=[];
            this.sel_expression_obj.background_color="";
            this.sel_expression_obj.font_color="";
            this.sel_expression_obj.newValue="";
            this.sel_expression_obj.font_size="";
            this.sel_expression_obj.isAggregate="";
            this.sel_expression_obj.linkUrl="";
            this.sel_expression_obj.linkTarget="";

        }
        ,handle_expression_obj_delete(id){
            let idx=this.sel_expression_obj.expression.findIndex(ite=>ite.id==id);
            if(idx>-1){
                this.sel_expression_obj.expression.splice(idx,1);
            }
        },
        handle_save_conditionlist(formName){
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    this.dialog_conditionFields = false;
                    this.conditionFields_list=this.conditionFields_list_temp;
                    this.handle_refreshConditionFields();
                    this.handle_resetALL();
                    Message.success('条件属性保存成功!');
                } else {
                   Message.error("非法的表达式!");
                }
            }); 
        },
       
        handle_closed_conditionlist(){
            this.sel_conditionFields_obj={};
            this.sel_expression_obj={};
        }
        ,handle_refreshConditionFields(){
            let idx= 0 ;
            let arr_field=[...this.rows_fieldList,...this.cols_fieldList,...this.numerics_fieldlist,...this.hide_fieldslist] ;
            for(let item of this.conditionFields_list){
                //新增的属性字段插入待选项列表
                if( arr_field.findIndex(ite=>ite.index==item.index || ite.name==item.label )<0 ){
                    this.hide_fieldslist.push({
                        name:item.label,
                        order:arr_field.length+idx,
                        index:item.index
                    });
                    idx++;
                }
                //修改字段名称
                this.rows_fieldList=this.handle_updateFields(this.rows_fieldList,item);
                this.cols_fieldList=this.handle_updateFields(this.cols_fieldList,item);
                this.numerics_fieldlist=this.handle_updateFields(this.numerics_fieldlist,item);
                this.hide_fieldslist=this.handle_updateFields(this.hide_fieldslist,item);
            }
            //清理不存在的属性字段
            this.rows_fieldList=this.handle_deleteFields(this.rows_fieldList,this.conditionFields_list);
            this.cols_fieldList=this.handle_deleteFields(this.cols_fieldList,this.conditionFields_list);
            this.numerics_fieldlist=this.handle_deleteFields(this.numerics_fieldlist,this.conditionFields_list);
            this.hide_fieldslist=this.handle_deleteFields(this.hide_fieldslist,this.conditionFields_list);
        }
        ,handle_updateFields(arr_list,conditionField){
            let up_index= arr_list.findIndex(ite=>ite.index==conditionField.index && ite.index!=undefined && ite.name!=conditionField.label )
            if(up_index>-1){
                arr_list[up_index].name=conditionField.label;
            }
            return arr_list;
        }
        //清理不存在的属性字段
        ,handle_deleteFields(arr_list,conditionFields_list){
            let arr_conditionFields_index=conditionFields_list.map(ite=>ite.index);
            for(let i=0;i<arr_list.length;i++){
                let item=arr_list[i];
                if(item.index!=undefined && !arr_conditionFields_index.includes(item.index) ){
                    arr_list.splice(i,1);
                }
            }
            return arr_list;
        }
        ,handle_ConditionUpdateToFields(){
            /*通过表达式字符区分字段是否含有开窗（聚合函数）*/
            //不含聚合函数的list,在表格计算前执行属性判断
            this.conditionFields_execute=[];
            //含聚合函数的list,在表格计算后执行属性判断
            this.conditionFields_execute_Aggregate=[];
            //从条件属性列表中提取出正在使用的 行、列、值字段,用于属性判断，以免对数据属性判断是增加开销
            let arr_field=[...this.rows_fieldList,...this.cols_fieldList,...this.numerics_fieldlist] ;
            for(let condition_field of this.conditionFields_list){
                let idx=arr_field.findIndex(ite=>ite.name==condition_field.label);
                let isAggregate=false;
                for(let expression_item of condition_field.expression_list){
                    if(expression_item.isAggregate=="true" || this.hanlde_validExpress_isAggregate(expression_item.newValue)){
                        isAggregate=true
                        break;
                    }
                    for(let expression_obj of expression_item.expression){
                        if(this.hanlde_validExpress_isAggregate(expression_obj.key_exp)){
                            isAggregate=true
                            break;
                        }
                        if(this.hanlde_validExpress_isAggregate(expression_obj.value_exp)){
                            isAggregate=true
                            break;
                        }
                    }
                }
                condition_field.isAggregate=isAggregate;
                if(idx>-1){
                    if(isAggregate){
                        this.conditionFields_execute_Aggregate.push(condition_field);
                    }
                    else{
                        this.conditionFields_execute.push(condition_field);
                    }
                }
            }
        }
        ,hanlde_validExpress_isAggregate(str_exp){
            let arr_fun_name=["sum","count"]
            let arr_field_name=this.conditionFields_execute_Aggregate.map(ite=>ite.label);
            for(let item of arr_fun_name){
                if(str_exp.indexOf(item)>-1){
                    return true;
                }
            }
            for(let item of arr_field_name){
                if(str_exp.indexOf(item)>-1){
                    return true;
                }
            }
            return false;
        }
        ,
        handle_conditionFields_show(){
            // this.handle_expression_obj_clear();
            this.expression_Fields_list=[];
            this.dialog_conditionFields=true;
            this.conditionFields_list_temp=JSON.parse( JSON.stringify(this.conditionFields_list));
            let index=0;
            for(let item of this.numerics_fieldlist){
                let temp_obj={
                    label:"sum('"+item.name+"')" ,
                    value:"sum('"+item.name+"')" ,
                    index:index
                };
                this.expression_Fields_list.push(temp_obj);
                index++;
            }
            let arr_list=[...this.rows_fieldList,...this.cols_fieldList,...this.numerics_fieldlist,...this.hide_fieldslist]
            for(let item of arr_list){
                let temp_obj={
                    label:"cell('"+item.name+"')",
                    value:"cell('"+item.name+"')",
                    index:index
                };
                this.expression_Fields_list.push(temp_obj);
                index++;
            }
        },
        handle_expression_value_edit(id,keyname){
            this.sel_type=id+"_|_"+keyname;
            this.dialog_functionDescription=true;
            let temp_obj=this.sel_expression_obj.expression.find(ite=>ite.id==id);
            if(temp_obj!=undefined){
                this.ipt_textarea_expression=temp_obj[keyname];
            }
            setTimeout(() => {
                const textarea = document.querySelector('textarea');
                textarea.focus()
             }, 200);
        },
        handle_expression_newValue_edit(){

             this.sel_type="newValue"
             this.ipt_textarea_expression=this.sel_expression_obj.newValue;
             this.dialog_functionDescription=true;
             setTimeout(() => {
                const textarea = document.querySelector('textarea');
                textarea.focus()
             }, 200);
        },
        handle_expression_linkUrl_edit(){
             this.sel_type="linkUrl"
             this.ipt_textarea_expression=this.sel_expression_obj.linkUrl;
             this.dialog_functionDescription=true;
             setTimeout(() => {
                const textarea = document.querySelector('textarea');
                textarea.focus()
             }, 200);
        },

        handle_dialog_Description_ok(){
            if( this.sel_type=="newValue"){
                this.sel_expression_obj.newValue=this.ipt_textarea_expression;
            }
            else if(this.sel_type=="linkUrl"){
                this.sel_expression_obj.linkUrl=this.ipt_textarea_expression;
            }
            else{
                let arr_keyval= this.sel_type.split('_|_');
                let id=arr_keyval[0];
                let keyname=arr_keyval[1]
                let temp_obj=this.sel_expression_obj.expression.find(ite=>ite.id==id);
                temp_obj[keyname]=this.ipt_textarea_expression;
            }
            this.dialog_functionDescription = false;
        },
        bindConditionField(rowItem,mapping_name,conditionFields_execute_list){
            //字段列表list
            for(let condition_field of conditionFields_execute_list){
                let field_name=mapping_name==undefined|| mapping_name[condition_field.label]==undefined?condition_field.label:mapping_name[condition_field.label];
                //if/else if列表list
                for(let expression_item of condition_field.expression_list){
                    let istrue=false;
                    if(expression_item.condition_type=="if" ){
                         //表达式列表list
                        for(let i=0;i< expression_item.expression.length;i++){
                            let expression_obj=expression_item.expression[i];
                            if(expression_obj.comparison+''!=''){
                                let key_exp=this.getExpression_value(rowItem,mapping_name,expression_obj.key_exp);
                                let comparison=expression_obj.comparison;
                                let value_exp=this.getExpression_value(rowItem,mapping_name,expression_obj.value_exp);
                                let compare_result=this.getComparison_result(key_exp,comparison,value_exp);
                                if(i==0){
                                    istrue=compare_result;
                                }
                                else{
                                    if( expression_obj.previous_relation=='or'  ){
                                        istrue=compare_result||istrue;
                                    }
                                    else{
                                        istrue=compare_result&&istrue;
                                    }
                                }
                            }
                        }
                        if(istrue){
                            if(expression_item.newValue.trim('')!==""){
                                rowItem[field_name]=this.getExpression_value(rowItem,mapping_name,expression_item.newValue);
                            }
                            let cell_style=this.setCell_style(expression_item);
                            if(cell_style!={}){
                                rowItem[field_name+"_cell_style"]=cell_style;
                            }
                            if(expression_item.linkUrl.trim()!==""){
                                rowItem[field_name+"_linkUrl"]=this.getExpression_value(rowItem,mapping_name,expression_item.linkUrl);
                            }
                            if(expression_item.linkTarget.trim()!==""){
                                rowItem[field_name+"_linkTarget"]=expression_item.linkTarget;
                            }
                            break;
                        }
                    }
                    else {
                        if(expression_item.newValue!==""){
                            rowItem[field_name]=this.getExpression_value(rowItem,mapping_name,expression_item.newValue);
                        }
                        let cell_style=this.setCell_style(expression_item);
                        if(cell_style!={}){
                            rowItem[field_name+"_cell_style"]=cell_style;
                        }
                        if(expression_item.linkUrl.trim('')!==""){
                            rowItem[field_name+"_linkUrl"]=this.getExpression_value(rowItem,mapping_name,expression_item.linkUrl);
                        }
                        if(expression_item.linkTarget.trim('')!==""){
                            rowItem[field_name+"_linkTarget"]=expression_item.linkTarget;
                        }
                        break;
                    }
                }
            }
            return rowItem;
        },
        setCell_style(expression_item){
            let cell_style={};
            if(expression_item.background_color!=""){
                cell_style["backgroundColor"]=expression_item.background_color;
            }
            if(expression_item.font_color!=""){
                cell_style["color"]=expression_item.font_color;
            }
            if(expression_item.font_size!=""){
                cell_style["fontSize"]=expression_item.font_size;
            }
            return cell_style;
        },
        bindConditionField_partition(rowItem,conditionFields_execute_list){
            for(let mapping_name of this.arr_groupNumerics_list){
                rowItem=this.bindConditionField(rowItem,mapping_name,conditionFields_execute_list);
            }
            return rowItem;
        },
        getExpression_value(rowItem,mapping_name,str_exp){
            let str_result="";
            str_exp=(str_exp+'').replace(/cell\(/g,'this.getCell_value(rowItem,mapping_name,');
            str_exp=(str_exp+'').replace(/sum\(/g,'this.getSum_value(rowItem,mapping_name,');
            str_result=eval(str_exp);
            return str_result;
        }
        ,getCell_value(rowItem,mapping_name,cell_name){
            if(mapping_name==undefined || mapping_name[cell_name]==undefined){
                //防止原数据二次污染
                if(rowItem[cell_name+'_bak']==undefined){
                    rowItem[cell_name+'_bak']=rowItem[cell_name];
                }
                return  rowItem[cell_name+'_bak'];
            }
            else{
                return rowItem[mapping_name[cell_name]];
            }
        }
        ,getSum_value(rowItem,mapping_name,cell_name){
            if(mapping_name==undefined || mapping_name[cell_name]==undefined){
                //防止原数据二次污染
                if(rowItem[cell_name+'_bak']==undefined){
                    rowItem[cell_name+'_bak']=rowItem[cell_name];
                }
                return rowItem[cell_name+'_bak'];
            }
            else{
                return rowItem[mapping_name[cell_name]];
            }
        }
        ,
        getComparison_result(key_exp,comparison,value_exp){
            let rtn=false;
            switch(comparison){
                case "<":
                    rtn=key_exp<value_exp;
                break;
                case "<=":
                    rtn=key_exp<=value_exp;
                break;
                case ">":
                    rtn=key_exp>value_exp;
                break;
                case ">=":
                    rtn=key_exp>=value_exp;
                break;
                case "==":
                    rtn=key_exp==value_exp;
                break;
                case "!=":
                    rtn=key_exp!=value_exp;
                break;
                case "indexOf":
                    rtn=(key_exp+'').indexOf(value_exp+'')>-1?true:false;
                break;
            }
            return rtn;
        },
        handle_orderby_fields(optName){
            let isnumber_field=this.numerics_fieldlist.find(ite=>ite.name==this.sel_tagtext);
            if(isnumber_field!=undefined){
                this.orderby_fields={isNumberField:true};
            }else{
                //非数值字段排序，从排序列表中删除该字段
                let arr_fields=this.numerics_fieldlist.filter( ite=> Object.keys(this.orderby_fields).includes(ite.name) );
                for(let item of arr_fields){
                    delete this.orderby_fields[item.name];
                }
                this.orderby_fields["isNumberField"]=false;
            }
            this.orderby_fields[ this.sel_tagtext]=optName;
            this.initTable();
        },
         handle_reset_orderby(){
            this.orderby_fields={};
            this.initTable();
        }
        ,
        handle_fields_dbclick(textToInsert,start_len){
             if(start_len==undefined ){
                start_len=textToInsert.length;
             }
            const textarea = document.querySelector('textarea');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if(this.ipt_textarea_expression==undefined){
                this.ipt_textarea_expression=textToInsert;
            }
            else{
                this.ipt_textarea_expression = this.ipt_textarea_expression.slice(0, start) + textToInsert + this.ipt_textarea_expression.slice(end);
            }
            // 更新光标位置
            this.$nextTick(() => {
                textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length-(textToInsert.length-start_len));
                textarea.focus();
            });
        },
        handle_exportConfig(){
            let arr_templates = Object.keys(localStorage);
            let temp_obj={};
            for (let item of arr_templates) {
                let ec_key= item;
                if(ec_key.indexOf('_cus_umytable')>-1){
                    let t_value =localStorage.getItem(ec_key);
                    temp_obj[ec_key]=t_value;
                }
            }
            if(temp_obj!={} && Object.keys(temp_obj).length>0 ){
                try {
                    downloadConfigJson(temp_obj,"table_config.json");
                }catch(err){
                    Message.error(err+"");
                }
            }
            else{
                Message.info("无配置项可导出!");
            }
        }
        ,
        handle_importConfig(){
            
            let _this=this;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';  // 只接受JSON文件
            input.click();  
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const jsonObject = JSON.parse(e.target.result);
                            let arr_keys=Object.keys(jsonObject);
                            for(let key of arr_keys){
                                if(key.indexOf('cus_umytable')>-1){
                                    let value=jsonObject[key];
                                    if(localStorage.getItem(key)==null){
                                        localStorage.setItem(key,value);
                                    }
                                    let filename=encodeURIComponent(_this.rpt_des_name+'_cus_umytable');
                                    let t_key = decodeURIComponent( key.replace(filename,''));
                                    try {
                                        let t_cfg = JSON.parse(decodeURIComponent(value));
                                        if (t_cfg.report_type != undefined && t_key!='系统默认' && _this.custom_templates.find(ite=>ite.label==t_key)==undefined ) {
                                            _this.custom_templates.push({
                                                label: t_key,
                                                value: t_key,
                                                grid_config: t_cfg
                                            });
                                        }
                                    }
                                    catch (err) {
                                        // Message.error(key+",解析键值错误："+err);
                                    }
                                }
                            }
                            Message.success("操作成功！");
                        } catch (err) {
                            Message.error(err+"");
                        }
                    };
                    // 读取文件内容为文本
                    reader.readAsText(file);
                }
            };
        }


    }, 
}

function downloadConfigJson(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2); 
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


//数学函数
function abs(x){
        return Math.abs(x);
    }
    function random(){
        return Math.random();
    }
    function ceil(x){
        return  Math.ceil(x);
    }
    function floor(x){
        return  Math.floor(x);
    } 
    function round(x,y){
        return  x.toFixed(y);
    }     
    function pow(x,y){
        return  Math.pow(x,y);
    } 
    //字符串函数
    function length(x){
        return x.length;
    }
    function indexOf(x,y){
        return x.indexOf(y);
    }
    function includes(x,y){
        return x.includes(y);
    }
    function replace(x,y,z){
        return x.replace(y,z);
    }
    function substring(x,y,z){
        return x.substring(y,z);
    }
    function trim(x){
        return x.trim();
    }
    function toLowerCase(x){
        return x.toLowerCase();
    }
    function toUpperCase(x){
        return x.toUpperCase();
    }
    function getdate() {
		return dateformat( new Date(),'yyyy-MM-dd HH:mm:ss');
	}
	function today() {
		return dateformat( new Date(),'yyyy-MM-dd HH:mm:ss');
	}
	function dateadd(interval, number, date) {
		var result = new Date(date);
		switch (interval.toLowerCase()) {
			case 'year':
			case 'yy':
			case 'y':
				result.setFullYear(result.getFullYear() + number);
				break;
			case 'month':
			case 'mm':
			case 'm':
				result.setMonth(result.getMonth() + number);
				break;
			case 'day':
			case 'dd':
			case 'd':
				result.setDate(result.getDate() + number);
				break;
			case 'hour':
			case 'hh':
			case 'h':
				result.setHours(result.getHours() + number);
				break;
			case 'minute':
			case 'mi':
				result.setMinutes(result.getMinutes() + number);
				break;
			case 'second':
			case 'ss':
			case 's':
				result.setSeconds(result.getSeconds() + number);
				break;
			default:
				throw new Error('【dateadd(x, num, date)】未定义的值: ' + interval);
		}
		return result;
	}

	 

	function dateformat(date, formatString) {
		if (!(date instanceof Date)) {
		   date=new Date(date);
		}

		// 获取日期各部分
		const year = date.getFullYear();
		const month = date.getMonth() + 1; 
		const day = date.getDate();
		const hour = date.getHours();
		const minute = date.getMinutes();
		const second = date.getSeconds();

		// 填充零的函数
		function pad(n) {
			return n < 10 ? '0' + n : n;
		}

		// 格式化字符串
		return formatString.replace(/YYYY|yyyy|yy|MM|mm|DD|dd|HH|hh|mm|SS|ss/g, token => {
			switch (token) {
				case 'YYYY': return year;
				case 'yyyy': return year;
				case 'yy': return ('' + year).slice(-2);
				case 'MM': return pad(month);
				//case 'mm': return month;
				case 'DD': return pad(day);
				case 'dd': return pad(day);
				case 'HH': return pad(hour);
				case 'hh': return pad(hour);
			   
				case 'mm': return pad(minute);
				case 'mi': return pad(minute);
				case 'SS': return pad(second);
				case 'ss': return pad(second);
				default: return token;
			}
		});
	}


	function datediff(interval, date1, date2) {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		// 检查日期是否有效
		if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
			throw new Error('Invalid date');
		}
		// 确保 d1 <= d2
		if (d1 > d2) {
			return -datediff(interval, date2, date1);
		}
		// 计算两个日期之间的时间差（以毫秒为单位）
		const diff = d2 - d1;
		// 根据指定的时间单位返回差异
		switch (interval.toLowerCase()) {
			case 'year':
			case 'yyyy':
			case 'yy':
			case 'y':
				return calculateYearDifference(d1, d2);
			case 'month':
			case 'mm':
			case 'm':
				return calculateMonthDifference(d1, d2);
			case 'day':
			case 'dd':
			case 'd':
				return Math.floor(diff / (1000 * 60 * 60 * 24));
			case 'hour':
			case 'hh':
			case 'h':
				return Math.floor(diff / (1000 * 60 * 60));
			case 'minute':
			case 'mi':
				return Math.floor(diff / (1000 * 60));
			case 'second':
			case 'ss':
			case 's':
				return Math.floor(diff / 1000);
			default:
				throw new Error(' 【datediff(x, date1, date2) 】未定义的值: ' + interval);
		}
	}

	function calculateYearDifference(startDate, endDate) {
		const years = endDate.getFullYear() - startDate.getFullYear();
		if (
			endDate.getMonth() < startDate.getMonth() ||
			(endDate.getMonth() === startDate.getMonth() && endDate.getDate() < startDate.getDate())
		) {
			return years - 1;
		}
		return years;
	}

	function calculateMonthDifference(startDate, endDate) {
		const yearDiff = endDate.getFullYear() - startDate.getFullYear();
		const monthDiff = endDate.getMonth() - startDate.getMonth();
		if (endDate.getDate() < startDate.getDate()) {
			return yearDiff * 12 + monthDiff - 1;
		}
		return yearDiff * 12 + monthDiff;
	}
    
 

    function datename(datePart, date) {
        if (!(date instanceof Date)) {
            date=new Date(date);
        }
        const daysOfWeek = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const monthsOfYear = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        switch (datePart.toLowerCase()) {
            case 'weekday':
            case 'week':
            case 'w':
                return daysOfWeek[date.getDay()];
            case 'month':
            case 'mm':
            case 'm':
                return monthsOfYear[date.getMonth()];
            case 'quarter':
            case 'q':
                return Math.ceil((date.getMonth() + 1) / 3);
            case 'year':
            case 'yy':
            case 'yyyy':
            case 'y':
                return date.getFullYear();
            case 'day':
            case 'dd':
            case 'd':
                return date.getDate();
            default:
                throw new Error(`【datename(datePart, date)】】未定义的值: ${datePart} `);
        }
    }
 
</script>




<style>
.cls_subtotal_row {
    font-weight: 700;
    color: #0b46f5;
    padding: 0 12px;
}
.cls_defaultBg_row{
    background-color: #eff1fc1c;
}
.cls_defaultBg_cell{
    background-color: #eef1fc76;
}

.elx-table--footer {
    font-weight: 1000;
}

.elx-table.size--mini {
    font-size: 8pt;
}

.cls_tempSelList {
    position: fixed;
    background: #fff;
    z-index: 10000;
    border: 1px solid rgb(211, 205, 205);
    border-radius: 6px;
    box-shadow: rgba(0, 0, 0, 0.07) 2px 2px 4px 4px;
    /* height: 200px; */
    /* overflow: 'auto'; */
}

.drag_plan {
    border: 1px solid #ece8ec;
    border-bottom: 0px;
}

.drag_row {
    width: 100%;
    float: left;
    border-bottom: 1px solid #f1e8e8;
    border-left: 1px solid #f1e8e8;
    border-right: 1px solid #f1e8e8;
    min-height: 37px;
    display: flex;
    align-items: center;
}

.drag_span {
    float: left;
    font-size: 12px;
    /* line-height: 25px; */
    margin-left: 18px;
}

.drag_doms {
    float: left;
    margin-left: 5px;
    width: calc(100% - 70px);
}

.cls_eltag {
    margin: 5px;
}

.cls_eltag:hover {
    background-color: #fff;
    /* color: #585858; */
}

.cls_eltag1 {
    margin: 5px;
}

.cls_eltag1:hover {
    background-color: #e1e8f7;
}

.drag_listgroup {
    display: flex;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    min-height: 37px;
    align-items: center;
}

.dragitem_icn {
    font-size: 14px;
}

.span_rowsfields {
    background-color: #ebf1fe;
}

.span_rowsfields:hover {
    background-color: #fff;
    color: #3a3939;
}

.span_colsfields {
    background-color: #ebf1fe;
}

.span_colsfields:hover {
    background-color: #fff;
    color: #3a3939;
}

.span_hidefields {
    background-color: #fff;
    color: #585858;
}

.span_hidefields:hover {
    background-color: #ebf4fe;
    color: #769efc;
}

.span_numericsfields {
    background-color: #f0f9ec;
    color: #67c23b;
}

.span_numericsfields:hover {
    background-color: #fff;
    color: #67c23b;
}

.el-loading-spinner i {
    color: #000;
}

.el-loading-spinner .el-loading-text {
    color: #000;
}

.el-loading-spinner {
    font-size: 25px;
    /* font-weight: 800; */
}

.el-tag {
    color: #3370ff;
    background-color: #ebf1ff;
}

.el-tag.el-tag--success {
    color: #1c5d22;
    background-color: #f0f9eb;
}

.el-tag.el-tag--success:hover {
    background-color: #fff;
}

.el-tag--plain {
    background-color: #fff;
}

thead {
    background-color: #e0e9fd;

}

.elx-table {
    color: #1a1c21;
    font-family: '微软雅黑';
}

.elx-table.border--full .elx-body--column,
.elx-table.border--full .elx-footer--column,
.elx-table.border--full .elx-header--column {
    background-image: linear-gradient(#bdd0fd, #bdd0fd), linear-gradient(#bdd0fd, #bdd0fd);

}

.elx-table .elx-table--body,
.elx-table .elx-table--footer,
.elx-table .elx-table--header {
    border-bottom: 1px solid #bdd0fd;
}

.elx-table.elx-editable.size--mini .elx-body--column,
.elx-table.size--mini .elx-body--column.col--ellipsis,
.elx-table.size--mini .elx-footer--column.col--ellipsis,
.elx-table.size--mini .elx-header--column.col--ellipsis {
    height: 28px;
}

.elx-table.elx-editable.size--small .elx-body--column,
.elx-table.size--small .elx-body--column.col--ellipsis,
.elx-table.size--small .elx-footer--column.col--ellipsis,
.elx-table.size--small .elx-header--column.col--ellipsis {
    height: 33px;
     /* font-size:12px;  */
}

.elx-cell--filter .elx-filter--btn {
    color: #000;
}

.elx-table.border--full .elx-table--fixed-left-wrapper {
    border-right: 1px solid #bdd0fd;
}

.el-radio {
    margin-right: 15px;
}

.cls_levelnode0 {
    font-weight: 900;
}

.cls_levelnode1 {
    font-weight: 600;
}

.cls_levelnode2 {
    font-weight: 400;
}

.el-radio-button--mini .el-radio-button__inner {
    padding: 7px 7px;
}
.elx-cell{
    white-space: nowrap;
    overflow: hidden;
}
.div_body{
    display: flex;
    justify-content: space-between;
    height: 65vh;
}
.left_body{
    padding: 6px;
}
.el-menu{
    border: none;
}
.el-divider--horizontal{
    margin-top: -1px;
}
.el-menu-item{
    border: 1px solid #ebedef;
    margin-top: 2px;
}

.left_top{
    border-bottom: 1px dashed #dcdfe6;  margin: 0 6px;
}
.cls_andflag{
    background-color: rgb(195 173 233);float: left;height: 100%;width: 30px;text-align: center;margin-left: -19px; color: #000;
}
.cls_orflag{
    background-color: rgb(53 140 161);
    color: #d4e5e7;
}
.ipt_area:focus{
    outline: none;
    border:none;
}
.ipt_area:not(:focus){
    outline: none;
    border:none;
}


/* --------- */
.head_tools{
    border-bottom: 1px solid #f1e8e8;width: calc( 100% - 2px );background-color: #f8f8f8;height: 35px;
}
.head_tools_link{
    color: #23527c !important; float: left;margin-left: 13px;font-size: 14px;font-weight: 500;
}
.cls_tempSelList_body{
    padding: 6px; overflow: auto; border-radius: 5px; width: 234px;
}
.cls_tempSelList_body_sortlink{
    margin-left: 0px;font-size:13px;
}
.cls_tempSelList_foot{
    width: 100%;border-top: 1px solid #dadada;
}
.cls_tempSelList_foot_btnlink{
    margin-left: 5px;
}
.cls_drag_plan{
    float: left; width: calc( 100% - 2px );
}
.cls_dragrow_btnSplitLine{
    height: 100%; border: 1px solid #c3afaf;margin-left: 20px; height: 20px;
}
.cls_dragrow_btnSplitLine_right{
    height: 100%; border: 1px solid #c3afaf;margin-left: 20px; height: 20px;width:0px;float:right
}

.cls_dragrow_btnlink{
    color: #409eff !important; float: left;margin-left: 13px;
}
.cls_dragrow_template_tip{
    font-size:11px;
}
.cls_dragrow_template_input{
    margin-bottom: 10px;margin-top:10px;
}
.cls_dragrow_template_btnlink_ok{
    color: #409eff;float: left;
}
.cls_dragrow_template_btnlink_del{
    color: #d14229;float: left;margin-left: 13px;
}
.cls_dragrow_btnlink_first{
    margin-left: 13px;
}
.cls_dragrow_span_expandTreelevel{
    float: left; line-height: 35px;
}
.cls_dragrow_input_number{
    width: 99px; top:0px;left: 4px;   
}
.cls_dragrow_input_number_tree{
    width: 99px; top:4px;left: 4px;   
}
.cls_dragrow_span_ColSubtotal{
    line-height:25px;
}
.cls_isConditionField{
    border: 1px dashed #000;
}
.cls_dragrow_i_black{
    color: black;
}
.cls_dragrow_eltag1_hidefields{
    color: #23527c;
}
.drag_row_div_desname{
    display:block;text-align: center;line-height: 55px; font-weight: 900;width: calc( 100% - 2px );border: none;  font-size: 18px;
}
.drag_row_div_desremark{
    text-align: left; min-height: 0px; line-height: 20px;margin-top: -15px; font-size: 12px; width: calc( 100% - 2px );border-bottom: 1px solid #bdd0fd
}
.drag_row_div_desremark_text{
    color: #000; height: 20px;width: 100%;
}
.cls_uxgrid_summary{
    float: left;margin-top: 0px;
}
.cls_dialog_detailTable_button{
    position: absolute;top: 50px;
}
.cls_uxgrid_detail{
    margin-top: 0px; margin-bottom:20px;
}
.cls_onditions_div_body{
    margin-top: -15px;
}
.cls_onditions_div_leftbody_top{
    width: 300px;border: 1px solid #dcdfe6;
}
.cls_onditions_div_leftbody_body{
    margin-top: 2px; overflow:auto;
}
.cls_onditions_div_leftbody_body_fields{
    height: 30px;line-height: 30px;
}
.cls_onditions_div_centerbody{
    margin-left: 6px;
}
.cls_onditions_div_centerbody_body{
    margin-top: 2px;
}
.cls_onditions_div_centerbody_expresslist{
    height: 30px;line-height: 30px;
}
.cls_onditions_div_rightbody{
    width: 1200px; border: 1px solid #dcdfe6;margin-left: 6px;
}
.cls_onditions_div_rightbody_input{
    width: 100%;
}
.cls_onditions_div_rightbody_select{
    width: 99%;
}
.cls_onditions_div_rightbody_prview{
    height: 40px;border: 1px dashed #918f8f; text-align: center;border-radius: 3px; width:99.5%
}
.cls_onditions_div_rightbody_input_newValue{
    width: calc( 100% - 100px )
}
.cls_onditions_div_rightbody_expresslist{
    margin-left: 10px;height: 308px; overflow: auto;  margin-top: -20px;
}

.cls_onditions_div_rightbody_expresslist_key{
  width: 85%;
}
.cls_onditions_div_rightbody_expresslist_comparison{
    width: 85%;
}
.cls_onditions_div_rightbody_expresslist_value{
    width: 85%;
}
.cls_onditions_div_rightbody_expresslist_relation{
    width: 99%;
}
.cls_onditions_div_rightbody_expresslist_btn_del{
    line-height: 40px;text-align: center;
}
.cls_functionDescription_plan{
    margin-top: -15px;height:65vh;
}
.cls_functionDescription_plan_left{
    width:30%;float:left; height:70%;border: 1px solid #dcdfe6;
}
.cls_functionDescription_plan_left_list{
    height:calc( 100% - 40px ) ; overflow:auto;padding:0px 12px;
}
.cls_functionDescription_plan_left_list_item{
   float: left;
}
.cls_functionDescription_plan_left_list_item_button{
    width: 100%;margin-bottom: 2px; text-align: left;
 }
 .cls_functionDescription_plan_right{
    width:calc( 70% - 7px );float:right; height:70%;border: 1px solid #dcdfe6;
}
.cls_functionDescription_plan_right_textarea{
    height:calc( 100% - 40px ) ; padding:0px 16px; width: calc( 100% - 33px ) 
}
.cls_functionDescription_plan_bottom{
    width:calc( 100% - 2px );float:left; height:29%;border:1px solid  #dcdfe6;;margin-top:3px; border-bottom:none; 
}
.cls_functionDescription_plan_bottom_list{
    overflow-x:auto; height:calc( 25%  ); border-bottom:1px solid #dcdfe6;
}
.cls_functionDescription_plan_bottom_list_div{
    margin:auto 3px;display:flex;align-items:center;height:100%;
}
.cls_functionDescription_plan_bottom_list_div_title{
    float:left; width:85px;text-align:right;
}
.cls_functionDescription_plan_bottom_list_div_item{
    margin-left:2px;
}
.cls_functionDescription_plan_bottom_list_div_tip{
    float:left; 
}


</style>

