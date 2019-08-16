(function (global, factory) {
    return factory;
})(this, function () {
    var // Promise methods
        // 注意，没有以下方法：resolveWith resolve rejectWith reject pipe when cancel
        // 即不允许调用resolve reject cancel等
        promiseMethods = "done fail isResolved isRejected promise then always pipe".split(" "),
        // Static reference to slice
        // 静态引用slice方法
        sliceDeferred = [].slice;
    var deferred = {
        _Deferred: function () {
            var // callbacks list
                // 回调函数数组（这里不翻译为队列，避免概念上的混淆）
                callbacks = [],
                // stored [ context , args ]
                // 存储上下文、参数，同时还可以标识是否执行完成（fired非空即表示已完成）
                // 这里的“完成”指回调函数数组中“已有”的函数都已执行完成；
                // 但是可以再次调用done添加回调函数，添加时fired会被重置为0
                fired,
                // to avoid firing when already doing so
                // 如果已经触发正在执行，避免再次触发
                firing,
                // flag to know if the deferred has been cancelled
                // 标识异步队列是否已被取消，取消后将忽略对done resolve resolveWith的调用
                cancelled,
                // 异步队列定义（这才是正主，上边的局部变量通过闭包引用）
                // the deferred itself
                deferred = {
                    // done( f1, f2, ...)
                    // 增加成功回调函数，状态为成功（resolved）时立即调用
                    done: function () {
                        // 如果已取消，则忽略本次调用
                        if (!cancelled) {
                            // 将后边代码用到的局部变量定义在代码块开始处的好处：
                            // 1.声明变量，增加代码可读性；
                            // 2.共享变量，提高性能
                            // 注：多年写Java的经验，养成了全局变量在开头、临时变量随用随定义的习惯，看来JavaScript有些不同
                            var args = arguments, // 回调函数数组
                                i, // 遍历变量
                                length, // 回调函数数组长度
                                elem, // 单个回调函数
                                type, // elem类型
                                _fired; // 用于临时备份fired（fired中存储了上下文和参数）
                            // 如果已执行完成（即fired中保留了上下文和参数）
                            // 则备份上下文和参数到_fired，同时将fired置为0
                            if (fired) {
                                _fired = fired;
                                fired = 0;
                            }
                            // 添加arguments中的函数到回调函数数组
                            for (i = 0, length = args.length; i < length; i++) {
                                elem = args[i];
                                type = jQuery.type(elem);
                                // 如果是数组，则递归调用
                                if (type === "array") {
                                    // 强制指定上下文为deferred，个人认为这里没必要指定上下文，因为默认的上下文即为deferred
                                    deferred.done.apply(deferred, elem);
                                } else if (type === "function") {
                                    callbacks.push(elem);
                                }
                            }
                            // 如果已执行（_fired表示Deferred的状态是确定的），则立即执行新添加的函数
                            // 使用之前指定的上下文context和参数args
                            if (_fired) {
                                deferred.resolveWith(_fired[0], _fired[1]);
                            }
                        }
                        return this;
                    },
                    // resolve with given context and args
                    // 执行，使用指定的上下文和参数
                    resolveWith: function (context, args) {
                        // 满足以下全部条件，才会执行：没有取消  没有正在执行 没有执行完成
                        // 如果已取消 或 已执行完成 或 正在执行，则忽略本次调用
                        if (!cancelled && !fired && !firing) {
                            // make sure args are available (#8421)
                            // 确保args可用，一个避免null、undefined造成ReferenceError的常见技巧
                            args = args || [];
                            // 执行过程中将firing改为1
                            firing = 1;
                            try {
                                // 遍历动态数组的技巧
                                while (callbacks[0]) {
                                    // 注意这里使用指定的context，而不是this
                                    callbacks.shift().apply(context, args);
                                }
                            }
                            // JavaScript支持try/catch/finally
                            finally {
                                fired = [context, args];
                                firing = 0;
                            }
                        }
                        return this;
                    },
                    // resolve with this as context and given arguments
                    // 把状态设置为Resolved
                    // 设置的理解不准确，因为是否Resolved，是调用isResolved判断firing、fired的状态得到的。
                    // 可以理解为执行
                    resolve: function () {
                        deferred.resolveWith(this, arguments);
                        return this;
                    },
                    // Has this deferred been resolved?
                    // 是否已执行（或解决）？
                    // 在执行或已执行完毕，都认为已执行/解决
                    // “已”可能不准确，因为执行过程中也认为是已执行
                    isResolved: function () {
                        // 正在运行中
                        // 或
                        // 已运行完（即fired不为空/0）
                        return !!(firing || fired);
                    },
                    // Cancel
                    // 取消异步队列
                    // 设置标记位，清空函数队列
                    cancel: function () {
                        cancelled = 1;
                        callbacks = [];
                        return this;
                    }
                };
            return deferred;
        }
    }
});