(function( window, undefined ) {
    var jQuery = (function() {
       // 构建jQuery对象
       var jQuery = function( selector, context ) {
           return new jQuery.fn.init( selector, context, rootjQuery );
       }
       // jQuery对象原型
       jQuery.fn = jQuery.prototype = {
           constructor: jQuery,
           init: function( selector, context, rootjQuery ) {
              // selector有以下7种分支情况：
              // DOM元素
              // body（优化）
              // 字符串：HTML标签、HTML字符串、#id、选择器表达式
              // 函数（作为ready回调函数）
              // 最后返回伪数组
           }
       };
       // Give the init function the jQuery prototype for later instantiation
       jQuery.fn.init.prototype = jQuery.fn;
       // 合并内容到第一个参数中，后续大部分功能都通过该函数扩展
       // 通过jQuery.fn.extend扩展的函数，大部分都会调用通过jQuery.extend扩展的同名函数
       jQuery.extend = jQuery.fn.extend = function() {};
       // 在jQuery上扩展静态方法
       jQuery.extend({
           // ready bindReady
           // isPlainObject isEmptyObject
           // parseJSON parseXML
           // globalEval
           // each makeArray inArray merge grep map
           // proxy
           // access
           // uaMatch
           // sub
           // browser
       });
        // 到这里，jQuery对象构造完成，后边的代码都是对jQuery或jQuery对象的扩展
       return jQuery;
    })();
    window.jQuery = window.$ = jQuery;
})(window);