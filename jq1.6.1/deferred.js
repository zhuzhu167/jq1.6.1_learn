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
        },
        // Full fledged deferred (two callbacks list)
        // 创建一个完整的异步队列（包含两个回调函数数组）
        // 异步队列有三种状态：初始化（unresolved），成功（resolved），失败（rejected）。
        // 执行哪些回调函数依赖于状态。
        // 状态变为成功（resolved）或失败（rejected）后，将保持不变。
        Deferred: function (func) {
            // _Deferred本  无成功状态  或  失败状态，有四种状态：初始化、执行中、执行完毕、已取消
            // 为了代码复用， 内部先实现了一个_Deferred
            // failDeferred通过闭包引用
            var deferred = jQuery._Deferred(),
                failDeferred = jQuery._Deferred(),
                promise;
            // Add errorDeferred methods, then and promise
            jQuery.extend(deferred, {
                // 增加成功回调函数和失败回调函数到各自的队列中
                // 便捷方法，两个参数可以是数组或null
                // 状态为成功（resolved）时立即调用成功回调函数
                // 状态为失败（rejected）时立即调用失败回调函数
                // 分别执行成功回调 或 失败回调
                then: function (doneCallbacks, failCallbacks) {
                    // 上下文在这里有切换：虽然done返回的是deferred，但是fail指向failDeferred.done，执行fail是上下文变为failDeferred
                    // 简单点说就是：
                    // 调用done时向deferred添加回调函数doneCallbacks
                    // 调用fail时向failDeferred添加回调函数failCallbacks
                    // 因此这行表达式执行完后，返回的是failDeferred
                    deferred.done(doneCallbacks).fail(failCallbacks);
                    // 强制返回deferred
                    return this;
                },
                // 注册一个callback函数，无论是resolved或者rejected都会被 调用。
                // 其实，是把传入的函数（数组），同时添加到deferred和failDeferred
                // 并没有像我想象的那样，存到单独的函数数组中
                always: function () {
                    // done的上下文设置为deferred，fail的上下文设置为this
                    // done和fail的上下文不一致吗？一致！在这里this等于deferred
                    // 但是这里如此设置上下文应该该如何解释呢？与then的实现有什么不一样呢？
                    // fail指向fail指向failDeferred.done，默认上下文是failDeferred，failDeferred的回调函数数组callbacks是通过闭包引用的，
                    // 这里虽然将failDeferred.done方法的上下文设置为deferred，但是不影响failDeferred.done的执行，
                    // 在failDeferred.done的最后将this替换为deferred，实现链式调用，
                    // 即调用过程中没有丢失上下文this，可以继续链式调用其他的方法而不会导致this混乱
                    // 从语法上，always要达到的效果与then要达到的效果一致
                    // 因此，这行代码可以改写为两行（类似then的实现方式）,效果是等价的
                    // deferred.done( arguments ).fail( arguments );
                    // returnr this;
                    return deferred.done.apply(deferred, arguments).fail.apply(this, arguments);
                },
                // 增加失败回调函数
                // 状态为失败（rejected）时立即调用
                fail: failDeferred.done,
                // 使用指定的上下文和参数执行失败回调函数队列
                // 通过调用failDeferred.rejectWith()实现
                rejectWith: failDeferred.resolveWith,
                // 调用失败回调函数队列
                // 通过调用failDeferred.resolve()实现
                reject: failDeferred.resolve,
                // 判断状态是否为成功（resolved）
                isRejected: failDeferred.isResolved,
                // 每次调用回调函数之前先调用传入的成功过滤函数或失败过滤函数，并将过滤函数的返回值作为回调函数的参数
                // 最终返回一个只读视图（调用promise实现）
                // fnDone在状态是否为成功（resolved）时被调用
                // fnFail在状态是否为失败（rejected）时被调用

                // 关于其他的解释：
                // 1. 有的文章翻译为“管道机制”，从字面无法理解要表达什么含义，因此至少是不准确
                // 2. 错误理解：所谓的pipe，只是把传入的fnDone和fnFail放到了成功队列和失败队列的数组头部
                pipe: function (fnDone, fnFail) {
                    return jQuery.Deferred(function (newDefer) {
                        jQuery.each({
                            done: [fnDone, "resolve"], // done在后文中会指向deferred.done
                            fail: [fnFail, "reject"]
                        }, function (handler, data) {
                            var fn = data[0],
                                action = data[1],
                                returned;
                            if (jQuery.isFunction(fn)) {
                                deferred[handler](function () {
                                    returned = fn.apply(this, arguments);
                                    if (returned && jQuery.isFunction(returned.promise)) {
                                        returned.promise().then(newDefer.resolve, newDefer.reject);
                                    } else {
                                        newDefer[action](returned);
                                    }
                                });
                            } else {
                                deferred[handler](newDefer[action]);
                            }
                        });
                    }).promise();
                },
                // Get a promise for this deferred
                // If obj is provided, the promise aspect is added to the object
                // 返回的是一个不完整的Deferred的接口，没有resolve和reject，即不能 修改Deferred对象的状态，
                // 这是为了不让外部函数提早触发回调函数，可以看作是一种只读视图。
                //
                // 比如$.ajax在1.5版本后不再返回XMLHttpRequest，而是返回一个封装了 XMLHttpRequest和Deferred对象接口的object。
                // 其中Deferred部分就是promise()得到 的，这样不让外部函数调用resolve和reject，防止在ajax完成前触发回调函数。
                // 把这两个函数的调用权限保留给ajax内部。
                promise: function (obj) {
                    if (obj == null) {
                        // 实际只会执行一次promise，第一次执行的结果被存储在promise变量中
                        if (promise) {
                            return promise;
                        }
                        promise = obj = {};
                    }
                    var i = promiseMethods.length;
                    // 又一种循环遍历方式
                    // 我习惯用:
                    // for( i = 0; i < len; i++ ) 或 for( i = len-1; i >=0; i-- ) 或 for( i = len; i--; )
                    // jQuery真是遍地是宝！
                    while (i--) {
                        obj[promiseMethods[i]] = deferred[promiseMethods[i]];
                    }
                    return obj;
                }
            });
            // Make sure only one callback list will be used
            // 成功队列执行完成后，会执行失败带列的取消方法
            // 失败队列执行完成后，会执行成功队列的取消方法
            // 确保只有一个函数队列会被执行，即要么执行成功队列，要么执行失败队列；
            // 即状态只能是或成功、或失败，无交叉调用
            // deferred和failDeferred的canceled属性，只能通过闭包引用，因此不用担心状态、上下文的混乱
            deferred.done(failDeferred.cancel).fail(deferred.cancel);
            // Unexpose cancel
            // 隐藏cancel接口，即无法从外部取消成功函数队列
            delete deferred.cancel;
            // Call given func if any
            // 执行传入的func函数
            if (func) {
                func.call(deferred, deferred);
            }
            return deferred;
        }
    }
});