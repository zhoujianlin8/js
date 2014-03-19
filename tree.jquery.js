/* ===========================================================
 * 树结构插件 v1.5.7.11
 * xiewu 2013.5.7
 *
 * var eventList = {
		tree.beforeCreate: 树对象初始化前
		tree.create: 树对象初始化后
		node.beforeCreate: 节点对象初始化前（只能配置数据，不能控制dom）
		node.create: 节点对象初始化后
		node.destroy: 节点对象删除前
		tree.open: 文件夹对象展开
		tree.close: 文件夹对象关闭
		dom.create: 对象初始化后
	}
 * ========================================================== */

;(function( $ ) {
var 
	// 简单对象扩展函数
	_$ = _$ || $

	// 模板函数
  , fTmpl = function(str, data) {
		if (typeof data !== 'object') data = [].slice.call(arguments, 1);
		return str.replace(/{(\w+)}/g, function($0, $1) {
			return data[$1] != undefined ? data[$1] : '';
		});
	}

  , uniqid = function(prefix) {
		var uid = new Date().getTime().toString(16);
		uid += Math.floor((1 + Math.random()) * Math.pow(16, (16 - uid.length)))
			.toString(16).substr(1);
		return (prefix || '') + uid;
	}

  , name = 'tree'

  , NodeElement, FolderElement, __hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) {
		for (var key in parent) {
			if (__hasProp.call(parent, key)) child[key] = parent[key];
		}

		function ctor() {
			this.constructor = child;
		}
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();
		child.__super__ = parent.prototype;
		return child;
	}
	
  , TREENODE = window.TREENODE = {
		PREV: 1,
		NEXT: 2,
		FIRST: 3,
		LAST: 4
	}

	/**
	 * [节点对象]
	 * @param {[item]} item [数据源]
	 */
	function Node(data) {
		this.item = data.item;
		this.id = data.item.id = data.item.id || uniqid('node_');///
		this.pid = data.item.pid;///
		this.name = this.label = data.item.name; ///
		this.child = this.children = data.item.child; ///
		this.open = data.item.open; ///
		this.isRootNode = data.item.isRootNode;///
		this.dom = data.dom;
		this.tree = data.tree;
		///$.extend(this, data);
		this.NodeElement = this._createNodeElement();
	};
	$.extend(Node.prototype, {
		_createNodeElement: function() {
			var self = this;
			if (self.isFolder()) {
				return new FolderElement(self);
			} else {
				return new NodeElement(self);
			}
		},
		addNode: function(item, where, callback) { ///
			var self = this;
			var domNode = self.tree._buildNode(item).dom;

			if (where === TREENODE.FIRST) {
				domNode.prependTo(self.tree.rootNode.dom);
			} else if (where === TREENODE.LAST) {
				domNode.appendTo(self.tree.rootNode.dom);
			} else if (where === TREENODE.PREV) {
				domNode.prependTo(self.dom.children('ul'));
				///self.dom.before(domNode); ///
			} else {
				domNode.appendTo(self.dom.children('ul'));
				///self.dom.after(domNode);///
			}

			//生成节点对象
			var nodeItem = new Node({
				item: item,
				tree: self.tree,
				dom: domNode
			});
			nodeItem.parent = self;///
			self.tree.nodeArr.push(nodeItem); ///
			domNode.data('tree.node', nodeItem); ///
			self.updateChildren(1, item);
			nodeItem.triggerEvent('node.create');
			nodeItem.triggerEvent('dom.create');
		},
		append: function(node_info) {
			/*var node = new Node(node_info);
			this.addChild(node);
			return node;*/
		},
		prepend: function(node_info) {
			/*var node = new Node(node_info);
			this.addChildAtPosition(node, 0);
			return node;*/
		},
		moveTo: function(nodeR, where) {
			var self = this
			if (self.parent) self.parent.updateChildren(-1, self);
			self.NodeElement.moveTo(nodeR, where);
			self.parent = where ? nodeR.parent : nodeR;
			self.parent.updateChildren(1, self, where);
			self.triggerEvent('dom.moveTo');///
		},
		addNodes: function(source, where) {
			var self = this
			if ($.isArray(source)) {///
				self.tree._recursionTree(source, self);///
				self.updateChildren(1, source);
				self.triggerEvent('dom.create');///
			}
		},
		delNode: function() {
			var self = this
			self.triggerEvent('node.destroy');///
			///self.delChildren();
			self.NodeElement.remove();
			var arr = self.tree.nodeArr; ///
			if (self.parent) self.parent.updateChildren(-1, self);
			for (var i = arr.length; i--;) {
				if (arr[i].id == self.id) {
					arr.splice(i, 1);
					break;
				}
			}
		},
		delChildren: function() {
			var self = this
			$.each(self.getChildren(), function() {
				this.delNode();
			});
		},
		setData: function(key, val, opts) {
			var self = this
			if (opts) {///
				if (opts.toggle) {// 切换当前状态
					val = !self.data(key);
				}
			} else {
				opts = {};
			}
			if (key === 'open') {
				var node = self
				// 打开所有上级路径
				if (opts.parent) node = node.parent;
				if (node) {
					if (node.isFolder() && (val != node.data(key))) {///hasChildren
						node.NodeElement.toggle(val, function() {
							node[key] = val;
							opts.on_finished && opts.on_finished();///
						}, opts.skip_slide);
					}
					if (opts.parent) node.setData(key, val, opts);
				}
			} else if (key === 'label' || key === 'text' || key === 'name') {///
				self.label = self.name = self.item.name = val;
				self.NodeElement.text(val);
			} else if (key === 'children' || key === 'child') {///
				self.children = self.child = self.item.child = val;
			} else {
				self.item[key] = val;
			}
			return self;
		},
		data: function() {
			var self = this
			if (!arguments.length) {
				return self.item;
			} else if (arguments.length === 1) {
				var key = arguments[0];
				if ($.inArray(key, ['id', 'pid', 'open', 'child']) > -1) {
					return self[key];
				} else if ($.inArray(key, ['li', 'ul', 'btns', 'title']) > -1) {
					return self.NodeElement.get(key);
				} else {
					return self.item[key];
				}
			}
			return self.setData.apply(self, arguments);
		},
		render: function(data) {
			var self = this
			$.each(data, function(key, val) {
				self.data(key, val);
			});
		},
		toJson: function() {///
			var self = this
			return self.item;
		},
		isEqual: function(nodeR) {
			var self = this
			return self.data('id') === nodeR.data('id');
		},
		isParent: function(nodeR) {
			var self = this
			return self.data('pid') === nodeR.data('id');
		},
		isFolder: function() {
			var self = this
			return self.child;
		},
		hasChildren: function() {
			var self = this
			return self.child && self.child.length;
		},
		getChildren: function() {
			var self = this
			  , tree = self.tree
			  , children = self.child
			  , arr = []
			if (self.isRootNode) {///
				var node = self.tree.getNodeById(children[0].id)
				children = node.data('child');
			}
			$.each(children, function() {
				var node = self.tree.getNodeById(this.id)
				arr.push(node);
			});
			return arr;
		},
		updateChildren: function(type, source, where) {
			var self = this
			if (type === 1) {// 添加
				if (!$.isArray(source)) {
					source = [source];
				}
				$.each(source, function(i, item) {
					item.pid = self.id;
				});
				self.child = (where == 0 ? source.concat(self.child) : self.child.concat(source));///
			} else if (type === -1) {/// 删除
				for (var i = self.child.length; i--;) {
					if (self.child[i].id == source.id) {
						self.child.splice(i, 1);
						break;
					}
				}
			} else {///0 替换
				if (!$.isArray(source)) {
					self.child = [source];
				} else {
					self.child = source;
				}
			}
		},
		triggerEvent: function(type, domTarget, data) {
			var self = this;
			domTarget = domTarget || self.dom;
			return domTarget.trigger({
				type: type,
				domTarget: domTarget,
				node: self
			}, [self, data]);
		}
	});

	NodeElement = (function() {

		function NodeElement(node) {
			this.init(node);
		}

		NodeElement.prototype.init = function(node) {
			this.node = node;
			return this.$element = node.dom;
		};

		NodeElement.prototype.get = function(key) {
			var list = {
				'li': 'getLi',
				'ul': 'getUl',
				'btns': 'getBtnContainer',
				'title': 'getTitle',
			};
			return this[list[key]]();
		};

		NodeElement.prototype.getLi = function() {
			return this.$element;
		};

		NodeElement.prototype.getUl = function() {////
			return this.$element.children('ul');
		};

		NodeElement.prototype.getBtnContainer = function() {///
			return this.$element.children('div').children('.option');
		};

		// 获得节点文字dom
		NodeElement.prototype.getTitle = function() {
			return this.$element.children('div').find('.name');
		};
		// 修改节点文字内容
		NodeElement.prototype.text = function(val) {
			return this.getTitle().html(val);///
		}

		NodeElement.prototype.select = function() {
			return this.getLi().addClass(CLASSES.selected);
		};

		NodeElement.prototype.deselect = function() {
			return this.getLi().removeClass(CLASSES.selected);
		};

		NodeElement.prototype.remove = function() {
			this.$element.remove();
		}

		NodeElement.prototype.moveTo = function(nodeR, where) {
			if (where) {
				this.$element[where == 1 ? 'insertAfter' : 'insertBefore'](nodeR.data('li'));
			} else {
				this.$element[0 ? 'appendTo' : 'prependTo'](nodeR.data('ul'));///
			}
		}

		return NodeElement;

	})();

	FolderElement = (function(_super) {

		__extends(FolderElement, _super);

		function FolderElement() {
			return FolderElement.__super__.constructor.apply(this, arguments);
		}

		FolderElement.prototype.getHitarea = function() {
			return this.$element.children('.' + CLASSES.hitarea);
		};

		FolderElement.prototype.toggle = function(flag, on_finished, skip_slide) {
			var self = this;
			if (self.getUl().is(":animated")) return;
			on_finished && on_finished();
			return self[flag ? 'open' : 'close'](skip_slide || !self.node.hasChildren());
		};

		FolderElement.prototype.open = function(skip_slide) {
			var self, doOpen;
			self = this;
			self.getHitarea().addClass(CLASSES.open).removeClass(CLASSES.closed);
			doOpen = function() {
				return self.node.triggerEvent('tree.open');///
			};
			if (skip_slide) {
				return doOpen();
			} else {
				return self.getUl().slideDown('fast', doOpen);///
			}
		};

		FolderElement.prototype.close = function(skip_slide) {
			var self, doClose;
			self = this;
			self.getHitarea().addClass(CLASSES.closed).removeClass(CLASSES.open);
			doClose = function() {
				return self.node.triggerEvent('tree.close');///
			};
			if (skip_slide) {
				return doClose();
			} else {
				return self.getUl().slideUp('fast', doClose);///
			}
		};

		return FolderElement;

	})(NodeElement);

	/**
	 * [树对象]
	 * @param {[type]} opts [description]
	 */
	function Tree(domTree, opts) {
		this.domTree = domTree; /// dom容器
		this.source = opts.source; // 数据源
		this.rootNode = null; // 根结点
		this.nodeArr = []; // 结点数组
		this.id_map = {};///
		this.opts = opts;
		this._init();
	};
	$.extend(Tree.prototype, {
		_init: function() {
			var self = this,
				opts = self.opts,
				source = self.source,
				target = opts.target,
				domTree = self.domTree;
			self.triggerEvent('tree.beforeCreate');///
			!source && (self.opts.source = []);///
			self._createNodeRoot(source);
			if (source) {
				source.length && self._view(source);
			} else {
				target ? domTree.append(target) : target = domTree; ///clone
				self._buildDataTree($(target), self.opts.source); ///
			}
			self.dom = self.domTree.children('ul');///
			self.triggerEvent('tree.create');///
			self._bindEvent(); ///
		},
		_view: function(source) {
			var self = this;
			self.domTree.append($.parseHTML('<ul class="tree fileTree">'));
			self._recursionTree(source, self.rootNode);///
			self.triggerEvent('dom.create');///
		},
		//递归树形
		_recursionTree: function(listItem, nodeP) {
			var self = this;
			var domP = nodeP ? nodeP.dom : self.domTree;
			var domUl = domP.children('ul');
			//循环数组生成树节点
			for (var i = 0, l = listItem.length, item, nodeItem; i < l; i++) {
				item = listItem[i];
				nodeItem = self._buildNode(item);
				if (nodeP) nodeItem.parent = nodeP; ///
				domUl.append(nodeItem.dom);///
				nodeItem.triggerEvent('node.create');///
				//如果有子集则进入递归
				if (item.child && item.child.length) {
					arguments.callee.call(self, item.child, nodeItem); ///
				}
			}
		},
		_buildNode: function(item, nodeP) {
			var self = this,
				domNode = $('<li>'),
				strNodeContent = '',
				type = 'file',
				nodeItem = self._createNode({
					item: item,
					tree: self,
					dom: domNode
				});
			nodeItem.triggerEvent('node.beforeCreate', self.domTree);///
			if (nodeItem.isFolder()) {
				type = 'folder';
				!item.child.length && (nodeItem.open = item.open = true);
				var openClass = nodeItem.data('open') ? CLASSES.open : CLASSES.closed;///
				strNodeContent += '<i class="' + CLASSES.hitarea + ' ' + openClass + '"></i>';
			}
			strNodeContent += fTmpl(self.opts.tmpl.nodeContent, item);
			domNode.addClass(type).append(strNodeContent);
			if (nodeItem.isFolder()) {
				var domUl = $('<ul>');
				!nodeItem.data('open') && domUl.css({'display':'none'});
				domNode.append(domUl);
			}
			self.nodeArr.push(nodeItem);
			domNode.data('tree.node', nodeItem); ///
			//节点构造后回调
			if ($.isFunction(self.opts.iCreate)) {
				self.opts.iCreate.call(self, nodeItem); ////
			}
			return nodeItem;
		},
		_buildDataTree: function(domTree, source) {
			var self = this,
				domNode, nodeItem;

			!function funTmp(domP, source, nodeP) {
				domP.children('li').each(function() {
					domNode = $(this);
					nodeItem = self._buildData(domNode);
					if (nodeP) nodeItem.parent = nodeP; ///
					source.push(nodeItem.item);
					nodeItem.triggerEvent('node.create');///
					if (nodeItem.item.child) { ///
						funTmp(domNode.children('ul'), nodeItem.item.child, nodeItem);
					}
				});
			}(domTree.children('ul'), source, self.rootNode);///
			return source;
		},
		_buildData: function(domNode, nodeP) {
			var self = this,
				item = {};
			var domItem = domNode.children('div');
			item.name = domItem.find('.name').text();
			item.memo = domItem.find('.memo').text(); ////
			if (domItem.hasClass('folder')) {
				item.open = domNode.children('i').hasClass('open');
				item.child = [];
			}
			var nodeItem = self._createNode({
				item: item,
				tree: self,
				dom: domNode
			}); ///
			self.nodeArr.push(nodeItem); ///
			domNode.data('tree.node', nodeItem); ///
			//节点构造回调
			if ($.isFunction(self.opts.iCreate)) {
				self.opts.iCreate.call(self, nodeItem); ////
			}
			return nodeItem;
		},
		_createNode: function(data) {
			return new Node(data);
		},
		_createNodeRoot: function(source) {
			var self = this;
			self.rootNode = self._createNode({
				item: {child:source, open:true, isRootNode:true},
				dom: self.domTree,
				tree: self
			}); ///
		},
		_bindEvent: function() {
			var self = this;
			//展开/关闭节点
			self.domTree.on('click.' + name, self.opts.trigger, function(e) {///
				var node = $.tree.getNode(this);
				node.data('open', null, {'toggle':true});
			});
		},
		getNodeById: function(node_id) {
			var self = this
			  , node
			$.each(self.nodeArr, function() {
				if (this.id == node_id) {
					node = this;
					return false;
				}
			});
			return node;
			///return this.id_map[node_id];
		},
		setData: function(key, val) {
			var self = this
			if (key === 'open') {
				$.each(self.nodeArr, function() {
					this.data('open', val);
				});
			}
			return self;
		},
		addNodeToIndex: function(node) {////
			if (node.id) {
				return this.id_map[node.id] = node;
			}
		},
		removeNodeFromIndex: function(node) {////
			if (node.id) {
				return delete this.id_map[node.id];
			}
		},
		destroy: function() {
			var self = this
			  , domTree = self.domTree
			if (!domTree.is('.tree')) domTree = domTree.find('.tree');
			domTree.remove();

			///self.domTree.find('*').andSelf().off('.' + name);
			self.triggerEvent('destroy_tree');///
			self.domTree.off(['.' + name, '.beforeCreate', '.create'].join(' '));///
			self.domTree.removeData(name);
			self.domTree = null;

			///self.rootNode.delNode();
		},
		triggerEvent: function(type, domTarget) {
			var self = this;
			domTarget = domTarget || self.domTree;
			return domTarget.trigger({
				type: type,
				domTarget: domTarget,
				node: self.rootNode
			}, self);
		}
	});
	///Tree.prototype.Node = Node;
	///Tree.prototype.NodeElement = NodeElement;

	$.fn.tree = function(opts, val) {
		var self = this;
		if (opts === 'getHandler') {
			var flagDom, flagData;
			if (val === 'tree') {
				flagDom = '.tree';
				flagData = 'tree';
			} else {
				flagDom = 'li';
				flagData = 'tree.node';
			}
			!self.is(flagDom) && (self = self.closest(flagDom));
			return (self.length && self.data(flagData)) || null;
		}
		var handle = this.data('tree');
		if (handle) return handle;
		opts = $.extend({}, $.fn.tree.defaults, opts);
		handle = new Tree(this, opts);
		this.find('.tree').andSelf().data('tree', handle);///
		return handle;
	};
	$.fn.tree.defaults = {
		trigger: '.hitarea',
		content: 'ul',
		unique: false,
		tmpl: {
			nodeContent: '<div class="item"><label class="tit"><span class="name">{name}</span></label><span class="option"></span></div>',
			placeholder: '<li class="placeholder">载入中</li>',
		},
	};
	$.tree = {};
	$.tree.classes = {
		open: "open-up",
		closed: "close-up",
		selected: "selected",
		expandable: "expandable",
		expandableHitarea: "expandable-hitarea",
		lastExpandableHitarea: "lastExpandable-hitarea",
		collapsable: "collapsable",
		collapsableHitarea: "collapsable-hitarea",
		lastCollapsableHitarea: "lastCollapsable-hitarea",
		lastCollapsable: "lastCollapsable",
		lastExpandable: "lastExpandable",
		last: "last",
		hitarea: "hitarea",
		folder: 'folder',
		file: 'file',
		option: 'option'
	};
	$.tree.getTree = function(element) {
		return $(element).tree('getHandler', 'tree');
	};
	$.tree.getNode = function(element) {
		return $(element).tree('getHandler', 'node');
	};
	$.tree.getNodeElement = function(element) {
		var node = this.getNode(element);
		return (node && node.NodeElement) || null;
	};
	var CLASSES = ($.tree.classes);
}(jQuery));