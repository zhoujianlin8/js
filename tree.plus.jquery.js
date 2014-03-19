/* ===========================================================
 * 树结构插件扩展 v1.5.7.21
 * xiewu 2013.5.7
 * ========================================================== */

;!function( win ) {
var 
	name = 'treePlus'

  , CLASSES = $.tree && $.tree.classes

	$.fn.tree.defaults.trigger = '.hitarea,.tit';

	var api = {
		init: function(tree, opts) {
			var defaults = {
				autoOpen: false
			  , noEmptyFolder: false
			  , autoHidden: false// TODO
			  , selectable: false
			  , onCanSelectNode: null
			  , draggable: false
			  , hasIco: true
			  , hasKeyText: false
			  , hasBan: false
			  , hasCheckbox: false
			  , hasAjax: false// TODO
			  , dataUrl: false// TODO
			  , icoList: {
			  	node: 'tree-node'
			  , btn: ''
			  }
			}
			opts = tree.optsPlus = $.extend({}, defaults, opts);
			this.bindEvent(tree, opts);
		},
		bindEvent: function(tree, opts) {
			var domTree = tree.domTree;
			// 监控树的清空事件
			domTree.on('destroy_tree.' + name, function(e) {
				$(this).off('.' + name);
			});

			// 鼠标点击
			if (opts.selectable) {
				api.select.init(domTree, opts.selectable);
			}
			/// 双击展开
			
			// 配置数据源
			domTree.on('node.beforeCreate', function(e) {
				var node = e.node;
				// 没有空文件夹
				if (opts.noEmptyFolder && !node.child.length) {
					node.child = node.item.child = null;
				}
				// 自动展开
				if (opts.autoOpen) {
					if (!node.isFolder()) return;
					var selector = opts.autoOpen.selector
					if (selector) {
						if ($.isFunction(selector)) {
							selector = selector(node);
						} else if (typeof selector === 'String') {
							if (selector === 'onlyRoot') {// 展开根节点
								selector = node.parent.isRootNode;
							} else {
								selector = node.dom.is(selector);
							}
						}
					} else {
						selector = true;
					}
					node.open = node.item.open = selector;
				}
				node.triggerEvent('node.beforeCreate_plus', node.tree.domTree);///
			});

			// 更新节点结构
			if (opts.hasIco || opts.hasBan || opts.hasKeyText || opts.hasCheckbox) {
				domTree.on('node.create', function(e) {
					var node = e.node
					api.addGifts(node);
					node.triggerEvent('node.create.plus');///
				});
				if (opts.hasCheckbox) {
					opts.hasCheckbox = api.checkbox.init(domTree, opts.hasCheckbox);
				}
			}

			// 拖动节点
			if (opts.draggable) {
				api.drag.init(domTree, opts.draggable);
			}
			////node._setData = node.setData;
		},
		getConf: function(tree){
			return tree.optsPlus;
		},
		setData: function(key, val, target){
			if (key === 'toggleCheckboxEvent') {
				api.checkbox.toggleCheckEvent(target, val);
			} else if (key === 'checked') {
				api.checkbox.setChecked_out(target.dom.find(':checkbox'), val);
			} else if (key === 'checkboxEvent') {
				for (var i = val.length; i--;) {
					api.checkbox.checkFolder(val[i].domTree);///
				}
			} else if (key === 'ico') {
				target.data('ico', val);
				api.editIco(target, target.tree.optsPlus);
			}
		},
		addGifts: function(node) {
			var opts = node.tree.optsPlus
			opts.hasIco && api.addIco(node, opts);
			opts.hasBan && api.addBan(node);
			opts.hasKeyText && api.addKeyText(node);
			opts.hasCheckbox && api.checkbox.view(node, opts.hasCheckbox);///
		},
		createTree: function(dom, type) {
			///new tree();
		},
		createIco: function(node, opts) {
			var ico = node.data('ico')
			if (!ico) {
				ico = node.data('child') ? 'folder' : 'file';
				node.data('ico', ico);
			}
			ico = opts.icoList.node + ' ' + ico + ' ico_node';
			return ico;
		},
		addIco: function(node, opts) {
			var ico = api.createIco(node, opts)
			node.dom.find('>.item .tit').prepend('<i class="' + ico + '"></i>');
		},
		editIco: function(node, opts) {
			var ico = api.createIco(node, opts)
			node.dom.find('>.item .tit .ico_node').removeClass().addClass(ico);
		},
		addBan: function(node) {
			node.data('ban') && node.dom.addClass('ban');
		},
		addKeyText: function(node) {
			var memo = node.data('memo')
			if (memo != null) {
				memo && node.dom.find('>.item .name').after('<span class="silver">（<span class="memo">' + memo + '</span>）</span>');
			}
		},
		checkbox: {
			init: function(domTree, opts) {
				var defaults = {/*
					name: ''
				  , valueKey: ''
				  , onlyChild: true
				  , checkEvent: true
				  , stopCheck: false
				  , addAttrKey: ''
				*/}
				opts = $.extend(defaults, opts);
				///this.view(node, opts);
				this.bindEvent(domTree, opts);
				return opts;
			},
			view: function(node, opts) {
				var item, strParams, checked, cheName, cheValue;
				item = node.item;
				strParams = checked = item.checked ? ' checked' : '';///
				cheName = (item.checkbox && item.checkbox.name) || opts.name;
				if (cheName && !(opts.onlyChild && node.child)) {///
					cheValue = (item.checkbox && item.checkbox.value) || opts.value || item[opts.valueKey];
					strParams += ' name="' + cheName + '"' + ' value="' + cheValue + '"';
				}
				if (opts.addAttrKey) {
					strParams += ' ' + opts.addAttrKey + '=' + item[opts.addAttrKey];
				}
				var sCheckbox = '<input type="checkbox"' + strParams + '>';
				node.dom.children('.item').prepend(sCheckbox);
			},
			bindEvent: function(domTree, opts) {
				var self = this
				if (opts.checkEvent) {
					// 勾选上级
					domTree.on('change.checkbox', '.file', function(e){
						if (!opts.stopCheck) {
							self.checkFolder(domTree, $(this));///
						}
					});
					// 勾选下级
					domTree.on('change.checkbox', '.folder >.item', function(e){
						if (!opts.stopCheck) {
							var checked = e.target.checked;
							var $cheList = $(this).closest('li').children('ul').find(':checkbox');
							self.setChecked_out($cheList, checked, true);
							self.checkFolder(domTree, $(this));///
						}
					});
				}
			},
			setChecked_out: function($cheList, flag, noTrigger) {
				$cheList.each(function(){
					$(this).checkbox().setChecked(flag, noTrigger);
				});
			},
			// 勾选文件夹节点
			checkFolder: function($content, $node) {
				///如有当前节点与父级节点比较
				///对空文件夹的处理
				var self = this
				var selfFun = arguments.callee
				$content.find('>ul >.folder').each(function() {
					var $li, $cheList, $cheListChecked, flag;
					$li = $(this);
					$cheList = $li.find('.file :checkbox');
					flag = false;
					if (($cheListChecked = $cheList.filter(':checked')).length) {
						///所有下级都选上，且不存在没有子节点的父节点
						if ($cheList.length === $cheListChecked.length && !$li.find('.folder:not(:has(.file))').length) {
							flag = true;
						}
					}
					$cheList = flag ? $li.find('.folder').andSelf().find('>.item :checkbox:not(:checked)') : $li.find('>.item :checked');
					self.setChecked_out($cheList, flag, true);
					!flag && selfFun.call(self, $li);
				});
			},
			toggleCheckEvent: function(tree, flag) {///数组
				var self = this
				if (flag) {
					self.checkFolder(tree.domTree);
				}
				tree.optsPlus.hasCheckbox.stopCheck = !flag;
			},
			getNodeChecked: function(tree){
				var arrTmp = []
				tree.domTree.find(':checked').each(function() {
					var node = $.tree.getNode(this);
					arrTmp.push(node);///node.id
				});
				return arrTmp;
			},
			setNodeChecked: function(nodes) {
				$.each(nodes, function(i, node){
					api.setData(node, 'checked', true);///
				});
				return true;
			}
		},
		drag: {
			init: function(domTree, opts) {
				var self = this
				  , defaults = {
					selector: null//'onlyChild'
				  , dragenter: null//function(){}
				  , drop: null//function(){}
				}
				opts = $.extend(defaults, opts);
				this.$dragLine = this.$dragLine || $('<div class=dragLine>');
				domTree.on('node.create', function(e) {
					var node = e.node
					  , selector = opts.selector
					if (selector) {
						if ($.isFunction(selector)) {
							selector = selector(node);
						} else if (typeof selector === 'String') {
							if (selector === 'onlyChild') {
								selector = !node.isFolder();
							} else {
								selector = node.dom.is(selector);
							}
						}
					} else {
						selector = true;
					}
					node.dom.prop("draggable", selector);
				});
				domTree
					.on({
						"dragstart": function(e) {
							self.DragIt(e, this);
							e.stopPropagation();
						},
						"dragenter": function(e){
							self.DragEnter(e, this, opts.dragenter);
							e.stopPropagation();
						},
						"dragover": function(e) {
							self.DragOver(e);
							return false;
						},
						/*"dragleave": function(e) {
							self.DragLeave(e);
							e.stopPropagation();
						},*/
						"drop": function(e) {
							self.DropIt(e, this, opts.drop);
							e.stopPropagation();
						}
					}, 'li')
					.on('dragenter', function() {
						self.$dragLine.detach();
					});
			}
		  , DragIt: function(e, target) {
				var $dragLine = this.$dragLine
				$dragLine.data('obj_drag', target);
			}
		  , DragEnter: function(e, target, dragenter) {
				var $dragLine = this.$dragLine
				if($dragLine.data('obj_drag').contains(target)) {
					$dragLine.detach();
				} else {
					var nodeR = $.tree.getNode(target);
					if(nodeR.data("open")) {// 展开，置顶插入
						nodeR.data('ul')[0 ? 'append' : 'prepend']($dragLine);///
					} else {// 闭合，同级排序
						nodeR.data('li')[1 ? 'after' : 'before']($dragLine);///
					}
				}
				dragenter && dragenter(target);///
			}
		  , DragOver: function(e) {
				///延时展开
				///e.preventDefault();
			}
		  , DragLeave: function(e) {
				///
			}
		  , DropIt: function(e, target, drop) {
				var $dragLine = this.$dragLine
				if (!$dragLine.is(':visible')) {
					return;
				}
				var obj_drag = $dragLine.data('obj_drag')
				  , node = $.tree.getNode(obj_drag)
				  , nodeR = $.tree.getNode(target)
				  , nodeP = $.tree.getNode($dragLine)
				  , isSort = node.isParent(nodeP)///
				  , where
				  , doMove
				$dragLine.detach();
				if(nodeR.isEqual(nodeP)) {
					where = 0;
				} else {
					where = 1;
				}
				doMove = function() {
					node.moveTo(nodeR, where);
				};
				drop && drop(node, [nodeR, nodeP, node], doMove);///
			}
		}
	  , select: {
	  	init: function(domTree, opts) {
			var defaults = {
				selector: null///'onlyChild'
			  , toggleFlag: true
			  , onlyFlag: true
			}
			opts = $.extend(defaults, opts);
			domTree.on('click.' + name, '.hitarea,.item', function(e) {
				var $this = $(this)
				  , node = $.tree.getNode($this)
				  , selector = opts.selector
				if (selector) {
					if ($.isFunction(selector)) {
						selector = selector(node, e.targer);
					} else if (typeof selector === 'String') {
						if (selector === 'onlyChild') {
							selector = !node.isFolder();
						} else {
							selector = node.dom.is(selector);
						}
					}
					if (selector) {
						var $liCur = domTree.find('li.cur').not(node.dom)
						node.dom[opts.toggleFlag ? 'toggleClass' : 'addClass']('cur');
						if (opts.onlyFlag) {
							$liCur.removeClass('cur');
						}
					}
				}
				node.triggerEvent('tree.click', $this, {target: e.target});
				e.stopPropagation();///
			});
	  	}
	  }
	  , addBtns: function(node, btns) {
			var $option = node.dom.find('>.item .option')
			  , $div = $('<div>')
			$.each(btns, function(i, btn){
				btn = $.extend({}, node.tree.optsPlus, btn);
				api.addBtn(btn).appendTo($div);
			});
			$option.append($div.children());
		}
	  , addBtn: function(opts) {
			var ico = opts.icoList.btn + ' ' + opts.ico
			  , text = opts.text
			  , $btn = $('<span><i class="' + ico + '"></i>' + text + '</span>')
			opts.callback && $btn.click(opts.callback);
			return $btn;
		}
	}
	$.tree.plus = api;
	win.treePlus = api;///
}(window);