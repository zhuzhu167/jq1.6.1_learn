(function (global, factory) {
	// 闭包1
	"use strict";
	// For CommonJS and CommonJS-like environments
	// 判断当前运行环境
	if (typeof module === "object" && typeof module.exports === "object") {
		// 在node环境下是没有window.document，是通过其他方法生成了window.document
		module.exports = global.document ?
			factory(global, true) :
			function (w) {
				if (!w.document) {
					throw new Error("jQuery requires a window with a document");
				}
				return factory(w);
			};
	} else {
		factory(global);
	}
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
	// 作用和 Array.prototype.slice 一样
	// 之后会使用多次，所以在全局定义 slice 的方法
	var slice = arr.slice;

	// 定义 jQuery 对象 
	jQuery = function (selector, context) {
		// new jQuery.fn.init() 是 new 一个构造函数并返回它的内存地址
		// jQuery.fn.init() 是调用这个函数并返回这个函数的值
		return new jQuery.fn.init(selector, context);
	}

	// fn 等于 prototype
	// 在 jQuery 对象的原型链下添加以下内容
	jQuery.fn = jQuery.prototype = {
		jquery: version,
		constructor: jQuery,
		length: 0,
		toArray: function () {
			return slice.call(this);
		},
		// 省略中间的代码 .......
		// 在前面定义过的 push 方法
		push: push,
		// 因为 sort 方法不常用到，所以直接用 Array.prototype.sort 的方法去取出
		sort: arr.sort,
		splice: arr.splice
	};

	var rootjQuery,
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
		// 在 jQuery 的原型链上拓展一个 init 的函数并赋值给 init
		init = jQuery.fn.init = function (selector, context, root) {

		};
	// 作用：让 init 和 jQuery共享同一个原型链（个人认为就是把 jQuery 对象的方法复制到 init 的原型链上）
	init.prototype = jQuery.fn;
	// rootjQuery就是获取 window.document
	rootjQuery = jQuery(document);

	// .....
	if (!noGlobal) {
		window.jQuery = window.$ = jQuery;
	}
	// 最后是要把整个 jQuery 对象 返回出去
	return jQuery;
})