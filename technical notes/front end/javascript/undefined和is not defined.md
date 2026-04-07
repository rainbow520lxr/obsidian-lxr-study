- is not defined 是指未声名
- undefined 是指声名但未赋值

当直接取值时未声名时
需要使用
typeof(Vue)!=='undefined'&&!!Vue

首先判断该值的类型采用字符串
然后使用!!转Vue到bool值
如果不转返回当前值
'' + null + undefined 都为false

已经声明可以直接
!!Vue

一般声名的情况下有（也包括自动神明的）
+ 对象属性没有
+ 数组【0]没有
+ var a;
