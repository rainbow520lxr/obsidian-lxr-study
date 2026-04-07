# 解决方案---添加div蒙层页
1. 将上层div设置为相对定位布局
2. 子容器分别都为绝对定位
3. 依靠z-index进行调节

父级元素{
    position:relative
    heigth: 6.56rem
}
背景蒙层{
    w: 8.4rem
    height: 4.72rem
    z-index:1001
    position: ab
    backgroun-color: #fdf3e6
}

抖动元素 ip-video{
    position: ab
    top: 0.933334
    
}

**尽管祖父容器的长宽固定的容器，而父容器是flex布局，当子容器长宽固定数量叠加会导致渲染溢出，祖父容器撑开的问题，如果内部使用js动态控制display，会造成抖动问题**

**1.使用蒙层解决**
**2.考虑是否v-show可以解决**

