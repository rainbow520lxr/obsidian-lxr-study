// 选择目标节点
var initHeight = document.body.clientHeight;
var target = document.body;
// 创建观察者对象
var observer = new MutationObserver(function(mutations) {
    console.log(initHeight);
});
// 配置观察选项:
var config = {
  attributes: true
}
// 传入目标节点和观察选项
observer.observe(target, config);
