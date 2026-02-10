[TOC]

# bean的生命周期

**Spring IOC容器可以管理bean的生命周期，Spring允许在bean生命周期内特定的时间点执行指定的任务。**

+ 初始化：init ——>Tomcat启动，Servlet对象就创建/初始化了
+ 服务：service——>浏览器发送请求，对应的Servlet进行处理调用
+ 销毁：destroy——>Tomcat停止

## 从未创建的bean的整体单例过程

```mermaid
graph TB
A[标记该bean处于正在创建的标记]
B[根据name获取该BEAN的合并后的根bean定义]
C[加锁beforeSingletonCreation]
D[加锁singletonFactory.getObject]
E[加锁afterSingletonCreation]
F[加锁添加单例:1.单例Map添加2.单例工厂MAP删除3.年轻单例MAP删除4.已注册单例MAP添加]
G[标记该bean结束创建]
H[使用类型转换器进行类型适配转换到目标]
A-->B-->C-->D-->E-->F-->G-->H
```

## bean如何从单例Map缓存集合中获取

```mermaid
graph TB
A{从成熟单例Map中寻找该缓存对象}
B{从年轻单例对象Map中获取该缓存对象}
C[从单例工厂Map中根据beanName获取该bean的ObjecFactory]
D{使用对象工厂创建对象}
Z[返回当前查到的对象]
A--当前单例为空或者正在创建-->B--当前单例为空或者正在创建-->加锁再次双重检查-->C-->D--创建成功-->1.向年轻单例Map中添加2.从单例工厂Map删除该对象工厂
A--存在-->Z
B--存在-->Z
D--创建失败-->Z
```



## 如何解决循环依赖问题

知识点一: 三级缓存MAP

1.private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

> 一级单例缓存，成熟单例MAP

2.private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);

> 二级单例缓存,年轻或早期单例MAP

3.private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);

> 三级单例缓存，单例工厂缓存MAP

4.private final Set<String> registeredSingletons = new LinkedHashSet<>(256);

> 注册单例集合名称集合



知识点二：类A和类B, A依赖B, B依赖A

注意: 先放入单例工厂缓存的三级缓存可以帮助更好的代理对象

```mermaid
graph TB
A[getBean<>A]
B[A实例化]
C[基于Autowired解析属性值]
E[getBean<>B]
F[B实例化]
G[基于Autowired解析属性值]
H[填充B的值]
I[返回B实例]
A-->B--将A放入三级缓存-->C-->E-->F--将B的ObjectFactory放入三级缓存-->G-->A-->使用A的ObjectFactory方法获取实例--三级缓存删除FactoryBean并进入二级缓存-->H--将B放入一级缓存中-->I--填充A的值-->返回A实例
```



## 使用ObjectFactory(FactoryBean)创建bean实例

```mermaid
graph TB
A[根据根bean定义和类型解析类并为类的方法覆盖进行标记]
B[resolveBeforeInstantiation在初始化之前使用BeanPostProcessors处理]
C[applyBeanPostProcessorsBeforeInstantiation:应用bean实例化前的bean后置处理器]
D[applyBeanPostProcessorsAfterInitialization:应用bean初始化后的bean后置处理器!!!此处可直接返回bean]
E[在单例域下从FactoryBean的Map中取出该bean的FactoryBean又名为BeanWrapper]
F[使用FactoryBean进行实例化1.优先使用beanPostProcessor获取构造器2.默认构造器进行实例化]
G[applyMergedBeanDefinitionPostProcessors:对MBD使用后置处理器可更改bean定义]
H[当该bean可以循环依赖1.添加单例工厂MAP2.添加单例到年轻单例MAP3.向注册的单例MAP添加]
I[populateBean:填充bean实例属性,可能会遇到循环依赖问题]
N[postProcessAfterInstantiation:实例化后的后置处理器]
O[InstantiationAwareBeanPostProcessor:实例化后置处理器例如自动注入后置处理器去获取属性值去注入]
P[applyPropertyValues:填充属性值]
J[applyBeanPostProcessorsBeforeInitialization]
K[invokeInitMethods:激活初始化方法]
L[applyBeanPostProcessorsAfterInitialization:应用bean后置处理器进行后和初始化]
M[registerDisposableBeanIfNecessary:注册销毁bean的接口或者方法]
A-->B-->C-->D-->E-->F-->G-->H-->I-->N-->O-->P-->J-->K-->L-->M
```

## 关于Aware接口的分析

带有aware后缀的接口，主要是针对于实现了此类接口的bean，这也就意味着 aware是特指 有特殊能力的bean



