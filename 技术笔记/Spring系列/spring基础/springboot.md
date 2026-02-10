[TOC]

# springboot

## springboot应用的启动

> SpringApplication.run(DemoApplication.class, args) // 入口 返回值 ConfigurableApplicationContext

应用入口DemoApplication.class是程序主类，主类添加@SpringBootApplication注解，调用SpringApplication的静态run方法，将主类和主函数入参作为入口参数。

>(new SpringApplication(primarySources)).run(args) // 返回 ConfigurableApplicationContext

通过以上函数的调用，可以大致将启动看成两部分

1. SpringApplication应用的初始化
2. 应用启动

在应用启动后同时返回ConfigurableApplicationContext可配置ConfigurableApplicationContext的IOC容器

### 应用的准备

> this((ResourceLoader)null, primarySources); // 初始化springboot应用
>
> public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources){...}

在启动时，主类作为参数传进来作为primarySources中的主资源之一，也可以传入其他类作为主资源，没有特殊指定ResourceLoader资源加载器则默认为null，以下为构造应用时需要初始化的属性，参照该表对部分属性值及关键的实例的创建和获取加以说明

| 属性                          | 类型                                                   | 初始化值                                                     | 描述                                                         |
| :---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| sources                       | LinkedHashSet                                          | new LinkedHashSet() // 空集                                  | 资源                                                         |
| bannerMode                    | Mode(Enum)                                             | Mode.CONSOLE                                                 | banner模式 OFF, CONSOLE, LOG;                                |
| logStartupInfo                | Boolean                                                | true                                                         |                                                              |
| addCommandLineProperties      | Boolean                                                | true                                                         |                                                              |
| addConversionService          | Boolean                                                | true                                                         |                                                              |
| headless                      | Boolean                                                | true                                                         |                                                              |
| registerShutdownHook          | Boolean                                                | true                                                         |                                                              |
| additionalProfiles            | Set                                                    | Collections.emptySet()                                       |                                                              |
| isCustomEnvironment           | Boolean                                                | false                                                        |                                                              |
| lazyInitialization            | Boolean                                                | false                                                        |                                                              |
| applicationContextFactory     | ApplicationContextFactory(Interface)                   | ApplicationContextFactory.DEFAULT                            | 由applicationContextFactory接口提供匿名内部类工厂            |
| applicationStartup            | ApplicationStartup                                     | ApplicationStartup.DEFAULT                                   | ApplicationStartup接口提供静态对象DefaultApplicationStartup() |
| resourceLoader                | ResourceLoader                                         | (ResourceLoader)null **入口参数**                            | SpringApplication初始化形参                                  |
| primarySources                | LinkedHashSet<Class<?>>                                | primarySources // **入口参数**                               | primarySources 入口主类资源数组                              |
| webApplicationType            | WebApplicationType                                     | WebApplicationType.deduceFromClasspath()                     |                                                              |
| bootstrapRegistryInitializers | List<BootstrapRegistryInitializer>                     | this.getBootstrapRegistryInitializersFromSpringFactories()   |                                                              |
| initializers                  | Collection<? extends ApplicationContextInitializer<?>> | this.getSpringFactoriesInstances(ApplicationContextInitializer.class) | ApplicationContext的初始化器 集合                            |
| listeners                     | Collection<? extends ApplicationListener<?>>           | this.getSpringFactoriesInstances(ApplicationListener.class)  | Application监听器 集合                                       |
| mainApplicationClass          | Class<?>                                               | this.deduceMainApplicationClass()                            | 应用主类                                                     |

#### 获取ApplicationContextFactory实例

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//

package org.springframework.boot;

import java.util.function.Supplier;
import org.springframework.beans.BeanUtils;
import org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext;
import org.springframework.boot.web.servlet.context.AnnotationConfigServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

@FunctionalInterface
public interface ApplicationContextFactory {
  	// R
    ApplicationContextFactory DEFAULT = (webApplicationType) -> {
        try {
            switch(webApplicationType) {
            case SERVLET:
                return new AnnotationConfigServletWebServerApplicationContext();
            case REACTIVE:
                return new AnnotationConfigReactiveWebServerApplicationContext();
            default:
                return new AnnotationConfigApplicationContext();
            }
        } catch (Exception var2) {
            throw new IllegalStateException("Unable create a default ApplicationContext instance, you may need a custom ApplicationContextFactory", var2);
        }
    };

    ConfigurableApplicationContext create(WebApplicationType webApplicationType);

    static ApplicationContextFactory ofContextClass(Class<? extends ConfigurableApplicationContext> contextClass) {
        return of(() -> {
            return (ConfigurableApplicationContext)BeanUtils.instantiateClass(contextClass);
        });
    }

    static ApplicationContextFactory of(Supplier<ConfigurableApplicationContext> supplier) {
        return (webApplicationType) -> {
            return (ConfigurableApplicationContext)supplier.get();
        };
    }
}
```

上述的ApplicationContextFactory的实现类的实现方式是相当优雅的:

1. 声明函数式接口ApplicationContextFactory
2. 定义接口变量（public final static 不可变静态类变量) DEFAULT 该变量为实现了ApplicationContextFactory接口的实例
3. 变量的赋值是实例化了一个实现ApplicationContextFactory函数式接口的匿名内部类，该抽象接口指向**ConfigurableApplicationContext create(WebApplicationType webApplicationType);**

综上：ApplicationContextFactory的实现在该接口变量中采用匿名内部类实例而得

**值得注意的是springboot通过函数式接口实现的简单工厂**

#### 获取ApplicationStartup实例

```java
ApplicationStartup DEFAULT = new DefaultApplicationStartup();
```

#### 获取WebApplicationType枚举值

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//

package org.springframework.boot;

import org.springframework.util.ClassUtils;

public enum WebApplicationType {
    NONE,
    SERVLET,
    REACTIVE;

    private static final String[] SERVLET_INDICATOR_CLASSES = new String[]{"javax.servlet.Servlet", "org.springframework.web.context.ConfigurableWebApplicationContext"};
    private static final String WEBMVC_INDICATOR_CLASS = "org.springframework.web.servlet.DispatcherServlet";
    private static final String WEBFLUX_INDICATOR_CLASS = "org.springframework.web.reactive.DispatcherHandler";
    private static final String JERSEY_INDICATOR_CLASS = "org.glassfish.jersey.servlet.ServletContainer";
    private static final String SERVLET_APPLICATION_CONTEXT_CLASS = "org.springframework.web.context.WebApplicationContext";
    private static final String REACTIVE_APPLICATION_CONTEXT_CLASS = "org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext";

    private WebApplicationType() {
    }
		// R
    static WebApplicationType deduceFromClasspath() {
        if (ClassUtils.isPresent("org.springframework.web.reactive.DispatcherHandler", (ClassLoader)null) && !ClassUtils.isPresent("org.springframework.web.servlet.DispatcherServlet", (ClassLoader)null) && !ClassUtils.isPresent("org.glassfish.jersey.servlet.ServletContainer", (ClassLoader)null)) {
            return REACTIVE;
        } else {
            String[] var0 = SERVLET_INDICATOR_CLASSES;
            int var1 = var0.length;

            for(int var2 = 0; var2 < var1; ++var2) {
                String className = var0[var2];
                if (!ClassUtils.isPresent(className, (ClassLoader)null)) {
                    return NONE;
                }
            }

            return SERVLET;
        }
    }

    static WebApplicationType deduceFromApplicationContext(Class<?> applicationContextClass) {
        if (isAssignable("org.springframework.web.context.WebApplicationContext", applicationContextClass)) {
            return SERVLET;
        } else {
            return isAssignable("org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext", applicationContextClass) ? REACTIVE : NONE;
        }
    }

    private static boolean isAssignable(String target, Class<?> type) {
        try {
            return ClassUtils.resolveClassName(target, (ClassLoader)null).isAssignableFrom(type);
        } catch (Throwable var3) {
            return false;
        }
    }
}
```

1. 当org.springframework.web.reactive.DispatcherHandler类存在，org.springframework.web.servlet.DispatcherServlet、org.glassfish.jersey.servlet.ServletContainer不存在时则给出响应式Web应用类型的枚举值

   ***web flux***

2. 当javax.servlet.Servlet和org.springframework.web.context.ConfigurableWebApplicationContext类都存在时，则给出传统Servlet Web应用的枚举值

   ***spring mvc***

3. None什么都不是

#### 从SpringFactories获取所有bootstrapRegistryInitiallizers实例（可自定义1）

```java
private List<BootstrapRegistryInitializer> getBootstrapRegistryInitializersFromSpringFactories() {
   ArrayList<BootstrapRegistryInitializer> initializers = new ArrayList<>();
   getSpringFactoriesInstances(Bootstrapper.class).stream()
         .map((bootstrapper) -> ((BootstrapRegistryInitializer) bootstrapper::initialize))
         .forEach(initializers::add);
   initializers.addAll(getSpringFactoriesInstances(BootstrapRegistryInitializer.class));
   return initializers;
}
```

bootstrapper初始化器由两类提供，1.实现了Bootstrapper.class的SPI(不建议使用了) 2.实现了BootstrapRegistryInitializer.class接口的SPI

**自定义BootstrapRegistryInitializer**

BootstrapRegistryInitializer.class接口的SPI 提供了函数式接口，而入参的BootstrapRegistry提供了如下规范可由初始化器进行操作

```java
package org.springframework.boot;

/**
 * Callback interface that can be used to initialize a {@link BootstrapRegistry} before it
 * is used.
 *
 * @author Phillip Webb
 * @since 2.4.5
 * @see SpringApplication#addBootstrapRegistryInitializer(BootstrapRegistryInitializer)
 * @see BootstrapRegistry
 */
@FunctionalInterface
public interface BootstrapRegistryInitializer {

	/**
	 * Initialize the given {@link BootstrapRegistry} with any required registrations.
	 * @param registry the registry to initialize
	 */
	void initialize(BootstrapRegistry registry);

}
```

BootstrapRegistry的开放提供

```java
package org.springframework.boot;

import java.util.function.Supplier;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.util.Assert;

/**
 * A simple object registry that is available during startup and {@link Environment}
 * post-processing up to the point that the {@link ApplicationContext} is prepared.
 * <p>
 * Can be used to register instances that may be expensive to create, or need to be shared
 * before the {@link ApplicationContext} is available. 重点
 * <p>
 * The registry uses {@link Class} as a key, meaning that only a single instance of a
 * given type can be stored.
 * <p>
 * The {@link #addCloseListener(ApplicationListener)} method can be used to add a listener
 * that can perform actions when {@link BootstrapContext} has been closed and the
 * {@link ApplicationContext} is fully prepared. For example, an instance may choose to
 * register itself as a regular Spring bean so that it is available for the application to
 * use.
 *
 * @author Phillip Webb
 * @since 2.4.0
 * @see BootstrapContext
 * @see ConfigurableBootstrapContext
 */
public interface BootstrapRegistry {

	/**
	 * Register a specific type with the registry. If the specified type has already been
	 * registered and has not been obtained as a {@link Scope#SINGLETON singleton}, it
	 * will be replaced.
	 * @param <T> the instance type
	 * @param type the instance type
	 * @param instanceSupplier the instance supplier
	 */
	<T> void register(Class<T> type, InstanceSupplier<T> instanceSupplier);

	/**
	 * Register a specific type with the registry if one is not already present.
	 * @param <T> the instance type
	 * @param type the instance type
	 * @param instanceSupplier the instance supplier
	 */
	<T> void registerIfAbsent(Class<T> type, InstanceSupplier<T> instanceSupplier);

	/**
	 * Return if a registration exists for the given type.
	 * @param <T> the instance type
	 * @param type the instance type
	 * @return {@code true} if the type has already been registered
	 */
	<T> boolean isRegistered(Class<T> type);

	/**
	 * Return any existing {@link InstanceSupplier} for the given type.
	 * @param <T> the instance type
	 * @param type the instance type
	 * @return the registered {@link InstanceSupplier} or {@code null}
	 */
	<T> InstanceSupplier<T> getRegisteredInstanceSupplier(Class<T> type);

	/**
	 * Add an {@link ApplicationListener} that will be called with a
	 * {@link BootstrapContextClosedEvent} when the {@link BootstrapContext} is closed and
	 * the {@link ApplicationContext} has been prepared.
	 * @param listener the listener to add
	 */
	void addCloseListener(ApplicationListener<BootstrapContextClosedEvent> listener);

	/**
	 * Supplier used to provide the actual instance when needed.
	 *
	 * @param <T> the instance type
	 * @see Scope
	 */
	@FunctionalInterface
	interface InstanceSupplier<T> {

		/**
		 * Factory method used to create the instance when needed.
		 * @param context the {@link BootstrapContext} which may be used to obtain other
		 * bootstrap instances.
		 * @return the instance
		 */
		T get(BootstrapContext context);

		/**
		 * Return the scope of the supplied instance.
		 * @return the scope
		 * @since 2.4.2
		 */
		default Scope getScope() {
			return Scope.SINGLETON;
		}

		/**
		 * Return a new {@link InstanceSupplier} with an updated {@link Scope}.
		 * @param scope the new scope
		 * @return a new {@link InstanceSupplier} instance with the new scope
		 * @since 2.4.2
		 */
		default InstanceSupplier<T> withScope(Scope scope) {
			Assert.notNull(scope, "Scope must not be null");
			InstanceSupplier<T> parent = this;
			return new InstanceSupplier<T>() {

				@Override
				public T get(BootstrapContext context) {
					return parent.get(context);
				}

				@Override
				public Scope getScope() {
					return scope;
				}

			};
		}

		/**
		 * Factory method that can be used to create an {@link InstanceSupplier} for a
		 * given instance.
		 * @param <T> the instance type
		 * @param instance the instance
		 * @return a new {@link InstanceSupplier}
		 */
		static <T> InstanceSupplier<T> of(T instance) {
			return (registry) -> instance;
		}

		/**
		 * Factory method that can be used to create an {@link InstanceSupplier} from a
		 * {@link Supplier}.
		 * @param <T> the instance type
		 * @param supplier the supplier that will provide the instance
		 * @return a new {@link InstanceSupplier}
		 */
		static <T> InstanceSupplier<T> from(Supplier<T> supplier) {
			return (registry) -> (supplier != null) ? supplier.get() : null;
		}

	}

	/**
	 * The scope of a instance.
	 * @since 2.4.2
	 */
	enum Scope {

		/**
		 * A singleton instance. The {@link InstanceSupplier} will be called only once and
		 * the same instance will be returned each time.
		 */
		SINGLETON,

		/**
		 * A prototype instance. The {@link InstanceSupplier} will be called whenver an
		 * instance is needed.
		 */
		PROTOTYPE

	}

}
```

#### 从SpringFactories获取所有ApplicationInitializer实例（可自定义2）

ApplicationInitializer同样采用SpringFactories的类SPI服务

```java
package org.springframework.context;

/**
 * Callback interface for initializing a Spring {@link ConfigurableApplicationContext}
 * prior to being {@linkplain ConfigurableApplicationContext#refresh() refreshed}.
 *
 * <p>Typically used within web applications that require some programmatic initialization
 * of the application context. For example, registering property sources or activating
 * profiles against the {@linkplain ConfigurableApplicationContext#getEnvironment()
 * context's environment}. See {@code ContextLoader} and {@code FrameworkServlet} support
 * for declaring a "contextInitializerClasses" context-param and init-param, respectively.
 *
 * <p>{@code ApplicationContextInitializer} processors are encouraged to detect
 * whether Spring's {@link org.springframework.core.Ordered Ordered} interface has been
 * implemented or if the {@link org.springframework.core.annotation.Order @Order}
 * annotation is present and to sort instances accordingly if so prior to invocation.
 *
 * @author Chris Beams
 * @since 3.1
 * @param <C> the application context type
 * @see org.springframework.web.context.ContextLoader#customizeContext
 * @see org.springframework.web.context.ContextLoader#CONTEXT_INITIALIZER_CLASSES_PARAM
 * @see org.springframework.web.servlet.FrameworkServlet#setContextInitializerClasses
 * @see org.springframework.web.servlet.FrameworkServlet#applyInitializers
 */
@FunctionalInterface
public interface ApplicationContextInitializer<C extends ConfigurableApplicationContext> {

   /**
    * Initialize the given application context.
    * @param applicationContext the application to configure
    */
   void initialize(C applicationContext);

}
```

ConfigurableApplicationContext 的开放提供

```java
package org.springframework.context;

import java.io.Closeable;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ProtocolResolver;
import org.springframework.core.metrics.ApplicationStartup;
import org.springframework.lang.Nullable;

/**
 * SPI interface to be implemented by most if not all application contexts.
 * Provides facilities to configure an application context in addition
 * to the application context client methods in the
 * {@link org.springframework.context.ApplicationContext} interface.
 *
 * <p>Configuration and lifecycle methods are encapsulated here to avoid
 * making them obvious to ApplicationContext client code. The present
 * methods should only be used by startup and shutdown code.
 *
 * @author Juergen Hoeller
 * @author Chris Beams
 * @author Sam Brannen
 * @since 03.11.2003
 */
public interface ConfigurableApplicationContext extends ApplicationContext, Lifecycle, Closeable {

   /**
    * Any number of these characters are considered delimiters between
    * multiple context config paths in a single String value.
    * @see org.springframework.context.support.AbstractXmlApplicationContext#setConfigLocation
    * @see org.springframework.web.context.ContextLoader#CONFIG_LOCATION_PARAM
    * @see org.springframework.web.servlet.FrameworkServlet#setContextConfigLocation
    */
   String CONFIG_LOCATION_DELIMITERS = ",; \t\n";

   /**
    * Name of the ConversionService bean in the factory.
    * If none is supplied, default conversion rules apply.
    * @since 3.0
    * @see org.springframework.core.convert.ConversionService
    */
   String CONVERSION_SERVICE_BEAN_NAME = "conversionService";

   /**
    * Name of the LoadTimeWeaver bean in the factory. If such a bean is supplied,
    * the context will use a temporary ClassLoader for type matching, in order
    * to allow the LoadTimeWeaver to process all actual bean classes.
    * @since 2.5
    * @see org.springframework.instrument.classloading.LoadTimeWeaver
    */
   String LOAD_TIME_WEAVER_BEAN_NAME = "loadTimeWeaver";

   /**
    * Name of the {@link Environment} bean in the factory.
    * @since 3.1
    */
   String ENVIRONMENT_BEAN_NAME = "environment";

   /**
    * Name of the System properties bean in the factory.
    * @see java.lang.System#getProperties()
    */
   String SYSTEM_PROPERTIES_BEAN_NAME = "systemProperties";

   /**
    * Name of the System environment bean in the factory.
    * @see java.lang.System#getenv()
    */
   String SYSTEM_ENVIRONMENT_BEAN_NAME = "systemEnvironment";

   /**
    * Name of the {@link ApplicationStartup} bean in the factory.
    * @since 5.3
    */
   String APPLICATION_STARTUP_BEAN_NAME = "applicationStartup";

   /**
    * {@link Thread#getName() Name} of the {@linkplain #registerShutdownHook()
    * shutdown hook} thread: {@value}.
    * @since 5.2
    * @see #registerShutdownHook()
    */
   String SHUTDOWN_HOOK_THREAD_NAME = "SpringContextShutdownHook";


   /**
    * Set the unique id of this application context.
    * @since 3.0
    */
   void setId(String id);

   /**
    * Set the parent of this application context.
    * <p>Note that the parent shouldn't be changed: It should only be set outside
    * a constructor if it isn't available when an object of this class is created,
    * for example in case of WebApplicationContext setup.
    * @param parent the parent context
    * @see org.springframework.web.context.ConfigurableWebApplicationContext
    */
   void setParent(@Nullable ApplicationContext parent);

   /**
    * Set the {@code Environment} for this application context.
    * @param environment the new environment
    * @since 3.1
    */
   void setEnvironment(ConfigurableEnvironment environment);

   /**
    * Return the {@code Environment} for this application context in configurable
    * form, allowing for further customization.
    * @since 3.1
    */
   @Override
   ConfigurableEnvironment getEnvironment();

   /**
    * Set the {@link ApplicationStartup} for this application context.
    * <p>This allows the application context to record metrics
    * during startup.
    * @param applicationStartup the new context event factory
    * @since 5.3
    */
   void setApplicationStartup(ApplicationStartup applicationStartup);

   /**
    * Return the {@link ApplicationStartup} for this application context.
    * @since 5.3
    */
   ApplicationStartup getApplicationStartup();

   /**
    * Add a new BeanFactoryPostProcessor that will get applied to the internal
    * bean factory of this application context on refresh, before any of the
    * bean definitions get evaluated. To be invoked during context configuration.
    * @param postProcessor the factory processor to register
    */
   void addBeanFactoryPostProcessor(BeanFactoryPostProcessor postProcessor);

   /**
    * Add a new ApplicationListener that will be notified on context events
    * such as context refresh and context shutdown.
    * <p>Note that any ApplicationListener registered here will be applied
    * on refresh if the context is not active yet, or on the fly with the
    * current event multicaster in case of a context that is already active.
    * @param listener the ApplicationListener to register
    * @see org.springframework.context.event.ContextRefreshedEvent
    * @see org.springframework.context.event.ContextClosedEvent
    */
   void addApplicationListener(ApplicationListener<?> listener);

   /**
    * Specify the ClassLoader to load class path resources and bean classes with.
    * <p>This context class loader will be passed to the internal bean factory.
    * @since 5.2.7
    * @see org.springframework.core.io.DefaultResourceLoader#DefaultResourceLoader(ClassLoader)
    * @see org.springframework.beans.factory.config.ConfigurableBeanFactory#setBeanClassLoader
    */
   void setClassLoader(ClassLoader classLoader);

   /**
    * Register the given protocol resolver with this application context,
    * allowing for additional resource protocols to be handled.
    * <p>Any such resolver will be invoked ahead of this context's standard
    * resolution rules. It may therefore also override any default rules.
    * @since 4.3
    */
   void addProtocolResolver(ProtocolResolver resolver);

   /**
    * Load or refresh the persistent representation of the configuration, which
    * might be from Java-based configuration, an XML file, a properties file, a
    * relational database schema, or some other format.
    * <p>As this is a startup method, it should destroy already created singletons
    * if it fails, to avoid dangling resources. In other words, after invocation
    * of this method, either all or no singletons at all should be instantiated.
    * @throws BeansException if the bean factory could not be initialized
    * @throws IllegalStateException if already initialized and multiple refresh
    * attempts are not supported
    */
   void refresh() throws BeansException, IllegalStateException;

   /**
    * Register a shutdown hook with the JVM runtime, closing this context
    * on JVM shutdown unless it has already been closed at that time.
    * <p>This method can be called multiple times. Only one shutdown hook
    * (at max) will be registered for each context instance.
    * <p>As of Spring Framework 5.2, the {@linkplain Thread#getName() name} of
    * the shutdown hook thread should be {@link #SHUTDOWN_HOOK_THREAD_NAME}.
    * @see java.lang.Runtime#addShutdownHook
    * @see #close()
    */
   void registerShutdownHook();

   /**
    * Close this application context, releasing all resources and locks that the
    * implementation might hold. This includes destroying all cached singleton beans.
    * <p>Note: Does <i>not</i> invoke {@code close} on a parent context;
    * parent contexts have their own, independent lifecycle.
    * <p>This method can be called multiple times without side effects: Subsequent
    * {@code close} calls on an already closed context will be ignored.
    */
   @Override
   void close();

   /**
    * Determine whether this application context is active, that is,
    * whether it has been refreshed at least once and has not been closed yet.
    * @return whether the context is still active
    * @see #refresh()
    * @see #close()
    * @see #getBeanFactory()
    */
   boolean isActive();

   /**
    * Return the internal bean factory of this application context.
    * Can be used to access specific functionality of the underlying factory.
    * <p>Note: Do not use this to post-process the bean factory; singletons
    * will already have been instantiated before. Use a BeanFactoryPostProcessor
    * to intercept the BeanFactory setup process before beans get touched.
    * <p>Generally, this internal factory will only be accessible while the context
    * is active, that is, in-between {@link #refresh()} and {@link #close()}.
    * The {@link #isActive()} flag can be used to check whether the context
    * is in an appropriate state.
    * @return the underlying bean factory
    * @throws IllegalStateException if the context does not hold an internal
    * bean factory (usually if {@link #refresh()} hasn't been called yet or
    * if {@link #close()} has already been called)
    * @see #isActive()
    * @see #refresh()
    * @see #close()
    * @see #addBeanFactoryPostProcessor
    */
   ConfigurableListableBeanFactory getBeanFactory() throws IllegalStateException;

}
```

#### 从SpringFactories获取所有ApplicationListener实例（可自定义3)

ApplicationListener也提供了对外的SPI服务

```java
package org.springframework.context;

import java.util.EventListener;
import java.util.function.Consumer;

/**
 * Interface to be implemented by application event listeners.
 *
 * <p>Based on the standard {@code java.util.EventListener} interface
 * for the Observer design pattern.
 *
 * <p>As of Spring 3.0, an {@code ApplicationListener} can generically declare
 * the event type that it is interested in. When registered with a Spring
 * {@code ApplicationContext}, events will be filtered accordingly, with the
 * listener getting invoked for matching event objects only.
 *
 * @author Rod Johnson
 * @author Juergen Hoeller
 * @param <E> the specific {@code ApplicationEvent} subclass to listen to
 * @see org.springframework.context.ApplicationEvent
 * @see org.springframework.context.event.ApplicationEventMulticaster
 * @see org.springframework.context.event.SmartApplicationListener
 * @see org.springframework.context.event.GenericApplicationListener
 * @see org.springframework.context.event.EventListener
 */
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {

   /**
    * Handle an application event.
    * @param event the event to respond to
    */
   void onApplicationEvent(E event);


   /**
    * Create a new {@code ApplicationListener} for the given payload consumer.
    * @param consumer the event payload consumer
    * @param <T> the type of the event payload
    * @return a corresponding {@code ApplicationListener} instance
    * @since 5.3
    * @see PayloadApplicationEvent
    */
   static <T> ApplicationListener<PayloadApplicationEvent<T>> forPayload(Consumer<T> consumer) {
      return event -> consumer.accept(event.getPayload());
   }

}
```

开放的ApplicationEvent事件对象

```java
package org.springframework.context;

import java.util.EventObject;

/**
 * Class to be extended by all application events. Abstract as it
 * doesn't make sense for generic events to be published directly.
 *
 * @author Rod Johnson
 * @author Juergen Hoeller
 * @see org.springframework.context.ApplicationListener
 * @see org.springframework.context.event.EventListener
 */
public abstract class ApplicationEvent extends EventObject {

   /** use serialVersionUID from Spring 1.2 for interoperability. */
   private static final long serialVersionUID = 7099057708183571937L;

   /** System time when the event happened. */
   private final long timestamp;


   /**
    * Create a new {@code ApplicationEvent}.
    * @param source the object on which the event initially occurred or with
    * which the event is associated (never {@code null})
    */
   public ApplicationEvent(Object source) {
      super(source);
      this.timestamp = System.currentTimeMillis();
   }


   /**
    * Return the system time in milliseconds when the event occurred.
    */
   public final long getTimestamp() {
      return this.timestamp;
   }

}
```

```java

package java.util;

/**
 * <p>
 * The root class from which all event state objects shall be derived.
 * <p>
 * All Events are constructed with a reference to the object, the "source",
 * that is logically deemed to be the object upon which the Event in question
 * initially occurred upon.
 *
 * @since JDK1.1
 */

public class EventObject implements java.io.Serializable {

    private static final long serialVersionUID = 5516075349620653480L;

    /**
     * The object on which the Event initially occurred.
     */
    protected transient Object  source;

    /**
     * Constructs a prototypical Event.
     *
     * @param    source    The object on which the Event initially occurred.
     * @exception  IllegalArgumentException  if source is null.
     */
    public EventObject(Object source) {
        if (source == null)
            throw new IllegalArgumentException("null source");

        this.source = source;
    }

    /**
     * The object on which the Event initially occurred.
     *
     * @return   The object on which the Event initially occurred.
     */
    public Object getSource() {
        return source;
    }

    /**
     * Returns a String representation of this EventObject.
     *
     * @return  A a String representation of this EventObject.
     */
    public String toString() {
        return getClass().getName() + "[source=" + source + "]";
    }
}
```

从主资源中获取主类类型

### 应用的启动

第一步：创建停止观察者，并启动

第二步：创建BootstrapContext

#### SpringApplicationRunListener 实现该接口监听器（可自定义4：介入SpringBoot应用的生命周期）

命名我们就可以知道它是一个用于监听SpringApplication运行的监听者，分析springboot启动流程我们会发现，它其实是用来在整个启动流程中接收不同执行点事件通知的监听者，SpringApplicationRunListener接口规定了SpringBoot的生命周期，在各个生命周期广播相应的事件，调用实际的ApplicationListener类。

SpringApplicationRunListener也提供了对外的SPI服务

```java
package org.springframework.boot;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.io.support.SpringFactoriesLoader;

/**
 * Listener for the {@link SpringApplication} {@code run} method.
 * {@link SpringApplicationRunListener}s are loaded via the {@link SpringFactoriesLoader}
 * and should declare a public constructor that accepts a {@link SpringApplication}
 * instance and a {@code String[]} of arguments. A new
 * {@link SpringApplicationRunListener} instance will be created for each run.
 *
 * @author Phillip Webb
 * @author Dave Syer
 * @author Andy Wilkinson
 * @since 1.0.0
 */
public interface SpringApplicationRunListener {

	/**
	 * Called immediately when the run method has first started. Can be used for very
	 * early initialization.
	 * @param bootstrapContext the bootstrap context
	 */
	default void starting(ConfigurableBootstrapContext bootstrapContext) {
		starting();
	}

	/**
	 * Called immediately when the run method has first started. Can be used for very
	 * early initialization.
	 * @deprecated since 2.4.0 for removal in 2.6.0 in favor of
	 * {@link #starting(ConfigurableBootstrapContext)}
	 */
	@Deprecated
	default void starting() {
	}

	/**
	 * Called once the environment has been prepared, but before the
	 * {@link ApplicationContext} has been created.
	 * @param bootstrapContext the bootstrap context
	 * @param environment the environment
	 */
	default void environmentPrepared(ConfigurableBootstrapContext bootstrapContext,
			ConfigurableEnvironment environment) {
		environmentPrepared(environment);
	}

	/**
	 * Called once the environment has been prepared, but before the
	 * {@link ApplicationContext} has been created.
	 * @param environment the environment
	 * @deprecated since 2.4.0 for removal in 2.6.0 in favor of
	 * {@link #environmentPrepared(ConfigurableBootstrapContext, ConfigurableEnvironment)}
	 */
	@Deprecated
	default void environmentPrepared(ConfigurableEnvironment environment) {
	}

	/**
	 * Called once the {@link ApplicationContext} has been created and prepared, but
	 * before sources have been loaded.
	 * @param context the application context
	 */
	default void contextPrepared(ConfigurableApplicationContext context) {
	}

	/**
	 * Called once the application context has been loaded but before it has been
	 * refreshed.
	 * @param context the application context
	 */
	default void contextLoaded(ConfigurableApplicationContext context) {
	}

	/**
	 * The context has been refreshed and the application has started but
	 * {@link CommandLineRunner CommandLineRunners} and {@link ApplicationRunner
	 * ApplicationRunners} have not been called.
	 * @param context the application context.
	 * @since 2.0.0
	 */
	default void started(ConfigurableApplicationContext context) {
	}

	/**
	 * Called immediately before the run method finishes, when the application context has
	 * been refreshed and all {@link CommandLineRunner CommandLineRunners} and
	 * {@link ApplicationRunner ApplicationRunners} have been called.
	 * @param context the application context.
	 * @since 2.0.0
	 */
	default void running(ConfigurableApplicationContext context) {
	}

	/**
	 * Called when a failure occurs when running the application.
	 * @param context the application context or {@code null} if a failure occurred before
	 * the context was created
	 * @param exception the failure
	 * @since 2.0.0
	 */
	default void failed(ConfigurableApplicationContext context, Throwable exception) {
	}

}
```

#### SpringApplicationRunListeners集合监听器

> SpringApplicationRunListeners listeners = getRunListeners(args);
>
> // [EventPublishingRunListener]

Springboot内置实现了 EventPublishingRunListener 事件发布RunListener，因此这里我们可以涉足Springboot应用的生命周期通过实现SpringApplicationRunListener！！！

> listeners.starting(bootstrapContext, this.mainApplicationClass);

通过listeners的方法统一调用所有的listener的相同的方法

#### SpringBoot实现的监听者模式————EventPublishingRunListener作为事件源实现

```java
package org.springframework.boot.context.event;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.springframework.boot.ConfigurableBootstrapContext;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.SpringApplicationRunListener;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ApplicationListener;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.ApplicationEventMulticaster;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.context.support.AbstractApplicationContext;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.util.ErrorHandler;

/**
 * {@link SpringApplicationRunListener} to publish {@link SpringApplicationEvent}s.
 * <p>
 * Uses an internal {@link ApplicationEventMulticaster} for the events that are fired
 * before the context is actually refreshed.
 *
 * @author Phillip Webb
 * @author Stephane Nicoll
 * @author Andy Wilkinson
 * @author Artsiom Yudovin
 * @author Brian Clozel
 * @since 1.0.0
 */
public class EventPublishingRunListener implements SpringApplicationRunListener, Ordered {

   private final SpringApplication application;

   private final String[] args;

   private final SimpleApplicationEventMulticaster initialMulticaster;

   public EventPublishingRunListener(SpringApplication application, String[] args) {
      this.application = application;
      this.args = args;
      this.initialMulticaster = new SimpleApplicationEventMulticaster();
      for (ApplicationListener<?> listener : application.getListeners()) {
         this.initialMulticaster.addApplicationListener(listener);
      }
   }

   @Override
   public int getOrder() {
      return 0;
   }

   @Override
   public void starting(ConfigurableBootstrapContext bootstrapContext) {
      this.initialMulticaster
            .multicastEvent(new ApplicationStartingEvent(bootstrapContext, this.application, this.args));
   }

   @Override
   public void environmentPrepared(ConfigurableBootstrapContext bootstrapContext,
         ConfigurableEnvironment environment) {
      this.initialMulticaster.multicastEvent(
            new ApplicationEnvironmentPreparedEvent(bootstrapContext, this.application, this.args, environment));
   }

   @Override
   public void contextPrepared(ConfigurableApplicationContext context) {
      this.initialMulticaster
            .multicastEvent(new ApplicationContextInitializedEvent(this.application, this.args, context));
   }

   @Override
   public void contextLoaded(ConfigurableApplicationContext context) {
      for (ApplicationListener<?> listener : this.application.getListeners()) {
         if (listener instanceof ApplicationContextAware) {
            ((ApplicationContextAware) listener).setApplicationContext(context);
         }
         context.addApplicationListener(listener);
      }
      this.initialMulticaster.multicastEvent(new ApplicationPreparedEvent(this.application, this.args, context));
   }

   @Override
   public void started(ConfigurableApplicationContext context) {
      context.publishEvent(new ApplicationStartedEvent(this.application, this.args, context));
      AvailabilityChangeEvent.publish(context, LivenessState.CORRECT);
   }

   @Override
   public void running(ConfigurableApplicationContext context) {
      context.publishEvent(new ApplicationReadyEvent(this.application, this.args, context));
      AvailabilityChangeEvent.publish(context, ReadinessState.ACCEPTING_TRAFFIC);
   }

   @Override
   public void failed(ConfigurableApplicationContext context, Throwable exception) {
      ApplicationFailedEvent event = new ApplicationFailedEvent(this.application, this.args, context, exception);
      if (context != null && context.isActive()) {
         // Listeners have been registered to the application context so we should
         // use it at this point if we can
         context.publishEvent(event);
      }
      else {
         // An inactive context may not have a multicaster so we use our multicaster to
         // call all of the context's listeners instead
         if (context instanceof AbstractApplicationContext) {
            for (ApplicationListener<?> listener : ((AbstractApplicationContext) context)
                  .getApplicationListeners()) {
               this.initialMulticaster.addApplicationListener(listener);
            }
         }
         this.initialMulticaster.setErrorHandler(new LoggingErrorHandler());
         this.initialMulticaster.multicastEvent(event);
      }
   }

   private static class LoggingErrorHandler implements ErrorHandler {

      private static final Log logger = LogFactory.getLog(EventPublishingRunListener.class);

      @Override
      public void handleError(Throwable throwable) {
         logger.warn("Error calling ApplicationEventListener", throwable);
      }

   }

}
```

`EventPublishingRunListener` 其实是作为Springapplication中监听器的代理发布者,而Springapplication本身也作为发布者

`EventPublishingRunListener` 只会在 Spring Boot 启动过程中处理事件，当 `run` 方法执行完毕后，后续的事件都是在 `context` 范围内的，这里加入 `context` 后，就能处理其他感兴趣的事件了。

事件源机制：

1. 初始化SimpleApplicationEventMulticaster简单应用事件广播器
2. 将SpringApplication中的ApplicationListener注册进广播器
3. 通过多播器发布ApplicationEvent

| 事件名称                                                | 发布者                                       | 发布方式                                     | 描述 |
| ------------------------------------------------------- | :------------------------------------------- | :------------------------------------------- | ---- |
| ApplicationStartingEvent（应用开始事件）                | EventPublishingRunListener的多播器           | 使用EventPublishingRunListener内置多播器发布 |      |
| ApplicationEnvironmentPreparedEvent（应用环境准备事件） | EventPublishingRunListener的多播器           |                                              |      |
| ApplicationContextInitializedEvent                      | EventPublishingRunListener                   |                                              |      |
| ApplicationPreparedEvent                                | EventPublishingRunListener                   |                                              |      |
| ApplicationStartedEvent                                 | SpringApplication                            |                                              |      |
| ApplicationReadyEvent                                   | SpringApplication                            |                                              |      |
| ApplicationFailedEvent                                  | SpringApplication/EventPublishingRunListener |                                              |      |
| AvailabilityChangeEvent                                 | SpringApplication                            |                                              |      |

| ApplicationListener                         | 作用                               |
| ------------------------------------------- | ---------------------------------- |
| RestartApplicationListener                  | restart 获取了main的资源，重启应用 |
| EnvironmentPostProcesserApplicationListener |                                    |
| AnsiOutputApplicationListener               |                                    |
| LoggingApplicationListener                  |                                    |
| BackgroundPreinitilizer                     |                                    |
| DelegatingApplicationListener               |                                    |
| ParentContextCloserApplicationListener      |                                    |
| DevtoolsLogFactorry                         |                                    |
| ClearCachesApplicationListener              |                                    |
| FileEncodingApplicationListener             |                                    |

#### 参数的获取

> ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);

#### 环境的准备

>  ConfigurableEnvironment environment = prepareEnvironment(listeners, bootstrapContext, applicationArguments);

1. 环境的创建

```java
	private ConfigurableEnvironment getOrCreateEnvironment() {
		if (this.environment != null) {
			return this.environment;
		}
		switch (this.webApplicationType) {
		case SERVLET:
			return new ApplicationServletEnvironment();
		case REACTIVE:
			return new ApplicationReactiveWebEnvironment();
		default:
			return new ApplicationEnvironment();
		}
	}
```

根据不同的应用类心该，创建不同的环境，在springboot中大致存在三种环境，1.servlet环境 2.reactive环境 3.默认环境 ，其分别去实现StandardServletEnvironment接口，以区别不同的环境的实现类

> configureEnvironment(environment, applicationArguments.getSourceArgs());

2. 环境的配置

```java
	protected void configureEnvironment(ConfigurableEnvironment environment, String[] args) {
		if (this.addConversionService) {
			environment.setConversionService(new ApplicationConversionService());
		}
		configurePropertySources(environment, args);
		configureProfiles(environment, args);
	}
```

configureEnvironment方法按照[environment](https://so.csdn.net/so/search?q=environment&spm=1001.2101.3001.7020).setConversionService -> configurePropertySources -> configureProfiles的顺序分别对属性源或配置文件进行细粒度控制

ApplicationConversionService是FormattingConversionService的一种特殊化，默认配置了适用于大多数 Spring Boot 应用程序的转换器和格式化程序。ApplicationConversionService专为直接实例化而设计，但也公开了静态addApplicationConverters和addApplicationFormatters(FormatterRegistry)实用程序方法，以便针对注册表实例临时使用。ApplicationConversionService构造方法如下：

addApplicationConverters方法添加对大多数 Spring Boot 应用程序有用的转换器。



3. application.yml属性的绑定

```java
listeners.environmentPrepared(bootstrapContext, environment);
bindToSpringApplication(environment);
ConfigurationPropertySources.attach(environment); 
```

触发所有监听器，绑定不同的属性

#### 打印不同的bannner

>  Banner printedBanner = printBanner(environment);

#### context的生命周期

1. context的创建

> context = createApplicationContext();
>
> return this.applicationContextFactory.create(this.webApplicationType);
>
> return new AnnotationConfigServletWebServerApplicationContext();

从这句可以看出springboot应用中的context的简单工厂根据this,webApplicationType，默认是servlet，根据工厂选择<u>AnnotationConfigServletWebServerApplicationContext</u>工厂,

## 重点扩展

### JAVA服务提供接口SPI机制之SpringFactory案例-SpringApplication::getSpringFactoriesInstances

> private <T> Collection<T> getSpringFactoriesInstances(Class<T> type); // SpringApplication的方法
>
> private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) // 多态

```java
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
		ClassLoader classLoader = getClassLoader();
		// Use names and ensure unique to protect against duplicates
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}
```

```java
public static final String FACTORIES_RESOURCE_LOCATION = "META-INF/spring.factories";
// spring.factories文件的格式为：key=value1,value2,value3
// 从所有的jar包中找到META-INF/spring.factories文件
// 然后从文件中解析出key=factoryClass类名称的所有value值
public static List<String> loadFactoryNames(Class<?> factoryClass, ClassLoader classLoader) {
    String factoryClassName = factoryClass.getName();
    // 取得资源文件的URL
    Enumeration<URL> urls = (classLoader != null ? classLoader.getResources(FACTORIES_RESOURCE_LOCATION) : ClassLoader.getSystemResources(FACTORIES_RESOURCE_LOCATION));
    List<String> result = new ArrayList<String>();
    // 遍历所有的URL
    while (urls.hasMoreElements()) {
        URL url = urls.nextElement();
        // 根据资源文件URL解析properties文件，得到对应的一组@Configuration类
        Properties properties = PropertiesLoaderUtils.loadProperties(new UrlResource(url));
        String factoryClassNames = properties.getProperty(factoryClassName);
        // 组装数据，并返回
        result.addAll(Arrays.asList(StringUtils.commaDelimitedListToStringArray(factoryClassNames)));
    }
    return result;
}
```

由于sprinboot会通过JDK的getResource自动加载META-INF/spring.factories中实现的接口因此，这里可以作为后续对listener和initializer等的扩展 :star: 完成三方介入和参与到springboot的周期中去



```
ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
```

#### 1.SPI机制

（1）SPI思想

- SPI的全名为Service Provider Interface.这个是针对厂商或者插件的。
- SPI的思想：系统里抽象的各个模块，往往有很多不同的实现方案，比如日志模块的方案，xml解析模块、jdbc模块的方案等。面向的对象的设计里，我们一般推荐模块之间基于接口编程，模块之间不对实现类进行硬编码。一旦代码里涉及具体的实现类，就违反了可拔插的原则，如果需要替换一种实现，就需要修改代码。为了实现在模块装配的时候能不在程序里动态指明，这就需要一种服务发现机制。**java spi就是提供这样的一个机制：为某个接口寻找服务实现的机制**

（2）SPI约定

- 当服务的提供者，提供了服务接口的一种实现之后，在jar包的META-INF/services/目录里同时创建一个以服务接口命名的文件。该文件里就是实现该服务接口的具体实现类。而当外部程序装配这个模块的时候，就能通过该jar包META-INF/services/里的配置文件找到具体的实现类名，并装载实例化，完成模块的注入。通过这个约定，就不需要把服务放在代码中了，通过模块被装配的时候就可以发现服务类了。

#### 2、SPI使用案例

- common-logging apache最早提供的日志的门面接口。只有接口，没有实现。具体方案由各提供商实现， 发现日志提供商是通过扫描 META-INF/services/org.apache.commons.logging.LogFactory配置文件，通过读取该文件的内容找到日志提工商实现类。只要我们的日志实现里包含了这个文件，并在文件里制定 LogFactory工厂接口的实现类即可。

#### 3、springboot中的类SPI扩展机制

- 在springboot的自动装配过程中，最终会加载META-INF/spring.factories文件，而加载的过程是由SpringFactoriesLoader加载的。从CLASSPATH下的每个Jar包中搜寻所有META-INF/spring.factories配置文件，然后将解析properties文件，找到指定名称的配置后返回。需要注意的是，其实这里不仅仅是会去ClassPath路径下查找，会扫描所有路径下的Jar包，只不过这个文件只会在Classpath下的jar包中。



```java
	private <T> List<T> createSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes,
			ClassLoader classLoader, Object[] args, Set<String> names) {
		List<T> instances = new ArrayList<>(names.size());
		for (String name : names) {
			try {
				Class<?> instanceClass = ClassUtils.forName(name, classLoader);
				Assert.isAssignable(type, instanceClass);
				Constructor<?> constructor = instanceClass.getDeclaredConstructor(parameterTypes);
				T instance = (T) BeanUtils.instantiateClass(constructor, args);
				instances.add(instance);
			}
			catch (Throwable ex) {
				throw new IllegalArgumentException("Cannot instantiate " + type + " : " + name, ex);
			}
		}
		return instances;
	}
```

根据全限定类名和beanUtils对进行反射实例化

> public final class SpringFactoriesLoader{...}
>
> > public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader);

> private <T> List<T> createSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, ClassLoader classLoader, Object[] args, Set<String> names);

### AnnotationConfigServletWebServerApplicationContext深入探索

该context继承 ServletWebServerApplicationContext 并且实现 AnnotationConfigRegistry接口，该接口意味着扩展该serveletcontext通过注解式配置servlet的能力，

>  Object
>
> > DefaultResourceLoader --> ResourceLoader   
> >
> > 从context的顶级实现类可以看出，context的核心基础是资源加载，初步具备的是资源加载的能力
> >
> > ```java
> >   package org.springframework.core.io;
> > 
> > import org.springframework.lang.Nullable;
> > import org.springframework.util.ResourceUtils;
> > 
> > /**
> >  * Strategy interface for loading resources (e.g., class path or file system
> >  * resources). An {@link org.springframework.context.ApplicationContext}
> >  * is required to provide this functionality plus extended
> >  * {@link org.springframework.core.io.support.ResourcePatternResolver} support.
> >  *
> >  * <p>{@link DefaultResourceLoader} is a standalone implementation that is
> >  * usable outside an ApplicationContext and is also used by {@link ResourceEditor}.
> >  *
> >  * <p>Bean properties of type {@code Resource} and {@code Resource[]} can be populated
> >  * from Strings when running in an ApplicationContext, using the particular
> >  * context's resource loading strategy.
> >  *
> >  * @author Juergen Hoeller
> >  * @since 10.03.2004
> >  * @see Resource
> >  * @see org.springframework.core.io.support.ResourcePatternResolver
> >  * @see org.springframework.context.ApplicationContext
> >  * @see org.springframework.context.ResourceLoaderAware
> >  */
> > public interface ResourceLoader {
> > 
> >    /** Pseudo URL prefix for loading from the class path: "classpath:". */
> >    String CLASSPATH_URL_PREFIX = ResourceUtils.CLASSPATH_URL_PREFIX;
> > 
> > 
> >    /**
> >     * Return a {@code Resource} handle for the specified resource location.
> >     * <p>The handle should always be a reusable resource descriptor,
> >     * allowing for multiple {@link Resource#getInputStream()} calls.
> >     * <p><ul>
> >     * <li>Must support fully qualified URLs, e.g. "file:C:/test.dat".
> >     * <li>Must support classpath pseudo-URLs, e.g. "classpath:test.dat".
> >     * <li>Should support relative file paths, e.g. "WEB-INF/test.dat".
> >     * (This will be implementation-specific, typically provided by an
> >     * ApplicationContext implementation.)
> >     * </ul>
> >     * <p>Note that a {@code Resource} handle does not imply an existing resource;
> >     * you need to invoke {@link Resource#exists} to check for existence.
> >     * @param location the resource location
> >     * @return a corresponding {@code Resource} handle (never {@code null})
> >     * @see #CLASSPATH_URL_PREFIX
> >     * @see Resource#exists()
> >     * @see Resource#getInputStream()
> >     */
> >    Resource getResource(String location);
> > 
> >    /**
> >     * Expose the {@link ClassLoader} used by this {@code ResourceLoader}.
> >     * <p>Clients which need to access the {@code ClassLoader} directly can do so
> >     * in a uniform manner with the {@code ResourceLoader}, rather than relying
> >     * on the thread context {@code ClassLoader}.
> >     * @return the {@code ClassLoader}
> >     * (only {@code null} if even the system {@code ClassLoader} isn't accessible)
> >     * @see org.springframework.util.ClassUtils#getDefaultClassLoader()
> >     * @see org.springframework.util.ClassUtils#forName(String, ClassLoader)
> >     */
> >    @Nullable
> >    ClassLoader getClassLoader();
> > 
> > }
> > ```
> >
> > > AbstractApplicationContext --> ConfigurableApplicationContext --- ApplicationContext, Lifecycle, Closeable 
> > >
> > > 在抽象应用context已经是spring应用的基准context, 其中ApplicationContext接口为其重要能力，其具体细分为environmentCapable,ListableBeanFactory, HierarchicalBeanFactory,MessageSource, ApplicationEventPublisher, ResourcePatternResolver这些能力
> > >
> > > !!!! 此处在下面重点分析
> > >
> > > 
> > >
> > > > GenericApplicationContext --> BeanDefinitionRegistry
> > > >
> > > > 通用应用context，这里扩展 **Bean定义注册中心**
> > > >
> > > > ```java
> > > > package org.springframework.beans.factory.support;
> > > > 
> > > > import org.springframework.beans.factory.BeanDefinitionStoreException;
> > > > import org.springframework.beans.factory.NoSuchBeanDefinitionException;
> > > > import org.springframework.beans.factory.config.BeanDefinition;
> > > > import org.springframework.core.AliasRegistry;
> > > > 
> > > > /**
> > > >  * Interface for registries that hold bean definitions, for example RootBeanDefinition
> > > >  * and ChildBeanDefinition instances. Typically implemented by BeanFactories that
> > > >  * internally work with the AbstractBeanDefinition hierarchy.
> > > >  *
> > > >  * <p>This is the only interface in Spring's bean factory packages that encapsulates
> > > >  * <i>registration</i> of bean definitions. The standard BeanFactory interfaces
> > > >  * only cover access to a <i>fully configured factory instance</i>.
> > > >  *
> > > >  * <p>Spring's bean definition readers expect to work on an implementation of this
> > > >  * interface. Known implementors within the Spring core are DefaultListableBeanFactory
> > > >  * and GenericApplicationContext.
> > > >  *
> > > >  * @author Juergen Hoeller
> > > >  * @since 26.11.2003
> > > >  * @see org.springframework.beans.factory.config.BeanDefinition
> > > >  * @see AbstractBeanDefinition
> > > >  * @see RootBeanDefinition
> > > >  * @see ChildBeanDefinition
> > > >  * @see DefaultListableBeanFactory
> > > >  * @see org.springframework.context.support.GenericApplicationContext
> > > >  * @see org.springframework.beans.factory.xml.XmlBeanDefinitionReader
> > > >  * @see PropertiesBeanDefinitionReader
> > > >  */
> > > > public interface BeanDefinitionRegistry extends AliasRegistry {
> > > > 
> > > >    /**
> > > >     * Register a new bean definition with this registry.
> > > >     * Must support RootBeanDefinition and ChildBeanDefinition.
> > > >     * @param beanName the name of the bean instance to register
> > > >     * @param beanDefinition definition of the bean instance to register
> > > >     * @throws BeanDefinitionStoreException if the BeanDefinition is invalid
> > > >     * @throws BeanDefinitionOverrideException if there is already a BeanDefinition
> > > >     * for the specified bean name and we are not allowed to override it
> > > >     * @see GenericBeanDefinition
> > > >     * @see RootBeanDefinition
> > > >     * @see ChildBeanDefinition
> > > >     */
> > > >    void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
> > > >          throws BeanDefinitionStoreException;
> > > > 
> > > >    /**
> > > >     * Remove the BeanDefinition for the given name.
> > > >     * @param beanName the name of the bean instance to register
> > > >     * @throws NoSuchBeanDefinitionException if there is no such bean definition
> > > >     */
> > > >    void removeBeanDefinition(String beanName) throws NoSuchBeanDefinitionException;
> > > > 
> > > >    /**
> > > >     * Return the BeanDefinition for the given bean name.
> > > >     * @param beanName name of the bean to find a definition for
> > > >     * @return the BeanDefinition for the given name (never {@code null})
> > > >     * @throws NoSuchBeanDefinitionException if there is no such bean definition
> > > >     */
> > > >    BeanDefinition getBeanDefinition(String beanName) throws NoSuchBeanDefinitionException;
> > > > 
> > > >    /**
> > > >     * Check if this registry contains a bean definition with the given name.
> > > >     * @param beanName the name of the bean to look for
> > > >     * @return if this registry contains a bean definition with the given name
> > > >     */
> > > >    boolean containsBeanDefinition(String beanName);
> > > > 
> > > >    /**
> > > >     * Return the names of all beans defined in this registry.
> > > >     * @return the names of all beans defined in this registry,
> > > >     * or an empty array if none defined
> > > >     */
> > > >    String[] getBeanDefinitionNames();
> > > > 
> > > >    /**
> > > >     * Return the number of beans defined in the registry.
> > > >     * @return the number of beans defined in the registry
> > > >     */
> > > >    int getBeanDefinitionCount();
> > > > 
> > > >    /**
> > > >     * Determine whether the given bean name is already in use within this registry,
> > > >     * i.e. whether there is a local bean or alias registered under this name.
> > > >     * @param beanName the name to check
> > > >     * @return whether the given bean name is already in use
> > > >     */
> > > >    boolean isBeanNameInUse(String beanName);
> > > > 
> > > > }
> > > > ```
> > > >
> > > > > GenericWebApplicationContext --> ConfigurableWebApplicationContext, ThemeSource
> > > > >
> > > > > 通用web应用context,具备可配置化的APPLICATIONComtext和主题资源 该接口非常重要 奠定基础，其实通用webApplicationContext已经继承了抽象的Applicationcontext已经是实现了ConfigurableApplicationContext， 但WebApplicationContext接口并未实现
> > > > >
> > > > > 该接口扩展web容器的可配置能力
> > > > >
> > > > > ```java
> > > > > package org.springframework.web.context;
> > > > > 
> > > > > import javax.servlet.ServletConfig;
> > > > > import javax.servlet.ServletContext;
> > > > > 
> > > > > import org.springframework.context.ConfigurableApplicationContext;
> > > > > import org.springframework.lang.Nullable;
> > > > > 
> > > > > /**
> > > > >  * Interface to be implemented by configurable web application contexts.
> > > > >  * Supported by {@link ContextLoader} and
> > > > >  * {@link org.springframework.web.servlet.FrameworkServlet}.
> > > > >  *
> > > > >  * <p>Note: The setters of this interface need to be called before an
> > > > >  * invocation of the {@link #refresh} method inherited from
> > > > >  * {@link org.springframework.context.ConfigurableApplicationContext}.
> > > > >  * They do not cause an initialization of the context on their own.
> > > > >  *
> > > > >  * @author Juergen Hoeller
> > > > >  * @since 05.12.2003
> > > > >  * @see #refresh
> > > > >  * @see ContextLoader#createWebApplicationContext
> > > > >  * @see org.springframework.web.servlet.FrameworkServlet#createWebApplicationContext
> > > > >  */
> > > > > public interface ConfigurableWebApplicationContext extends WebApplicationContext, ConfigurableApplicationContext {
> > > > > 
> > > > >    /**
> > > > >     * Prefix for ApplicationContext ids that refer to context path and/or servlet name.
> > > > >     */
> > > > >    String APPLICATION_CONTEXT_ID_PREFIX = WebApplicationContext.class.getName() + ":";
> > > > > 
> > > > >    /**
> > > > >     * Name of the ServletConfig environment bean in the factory.
> > > > >     * @see javax.servlet.ServletConfig
> > > > >     */
> > > > >    String SERVLET_CONFIG_BEAN_NAME = "servletConfig";
> > > > > 
> > > > > 
> > > > >    /**
> > > > >     * Set the ServletContext for this web application context.
> > > > >     * <p>Does not cause an initialization of the context: refresh needs to be
> > > > >     * called after the setting of all configuration properties.
> > > > >     * @see #refresh()
> > > > >     */
> > > > >    void setServletContext(@Nullable ServletContext servletContext);
> > > > > 
> > > > >    /**
> > > > >     * Set the ServletConfig for this web application context.
> > > > >     * Only called for a WebApplicationContext that belongs to a specific Servlet.
> > > > >     * @see #refresh()
> > > > >     */
> > > > >    void setServletConfig(@Nullable ServletConfig servletConfig);
> > > > > 
> > > > >    /**
> > > > >     * Return the ServletConfig for this web application context, if any.
> > > > >     */
> > > > >    @Nullable
> > > > >    ServletConfig getServletConfig();
> > > > > 
> > > > >    /**
> > > > >     * Set the namespace for this web application context,
> > > > >     * to be used for building a default context config location.
> > > > >     * The root web application context does not have a namespace.
> > > > >     */
> > > > >    void setNamespace(@Nullable String namespace);
> > > > > 
> > > > >    /**
> > > > >     * Return the namespace for this web application context, if any.
> > > > >     */
> > > > >    @Nullable
> > > > >    String getNamespace();
> > > > > 
> > > > >    /**
> > > > >     * Set the config locations for this web application context in init-param style,
> > > > >     * i.e. with distinct locations separated by commas, semicolons or whitespace.
> > > > >     * <p>If not set, the implementation is supposed to use a default for the
> > > > >     * given namespace or the root web application context, as appropriate.
> > > > >     */
> > > > >    void setConfigLocation(String configLocation);
> > > > > 
> > > > >    /**
> > > > >     * Set the config locations for this web application context.
> > > > >     * <p>If not set, the implementation is supposed to use a default for the
> > > > >     * given namespace or the root web application context, as appropriate.
> > > > >     */
> > > > >    void setConfigLocations(String... configLocations);
> > > > > 
> > > > >    /**
> > > > >     * Return the config locations for this web application context,
> > > > >     * or {@code null} if none specified.
> > > > >     */
> > > > >    @Nullable
> > > > >    String[] getConfigLocations();
> > > > > 
> > > > > }
> > > > > ```
> > > > >
> > > > > webApplication接口，其中父接口ApplicationContext也已经在抽象容器中实现
> > > > >
> > > > > 扩展web能力
> > > > >
> > > > > ```java
> > > > > package org.springframework.web.context;
> > > > > 
> > > > > import javax.servlet.ServletContext;
> > > > > 
> > > > > import org.springframework.context.ApplicationContext;
> > > > > import org.springframework.lang.Nullable;
> > > > > 
> > > > > /**
> > > > >  * Interface to provide configuration for a web application. This is read-only while
> > > > >  * the application is running, but may be reloaded if the implementation supports this.
> > > > >  *
> > > > >  * <p>This interface adds a {@code getServletContext()} method to the generic
> > > > >  * ApplicationContext interface, and defines a well-known application attribute name
> > > > >  * that the root context must be bound to in the bootstrap process.
> > > > >  *
> > > > >  * <p>Like generic application contexts, web application contexts are hierarchical.
> > > > >  * There is a single root context per application, while each servlet in the application
> > > > >  * (including a dispatcher servlet in the MVC framework) has its own child context.
> > > > >  *
> > > > >  * <p>In addition to standard application context lifecycle capabilities,
> > > > >  * WebApplicationContext implementations need to detect {@link ServletContextAware}
> > > > >  * beans and invoke the {@code setServletContext} method accordingly.
> > > > >  *
> > > > >  * @author Rod Johnson
> > > > >  * @author Juergen Hoeller
> > > > >  * @since January 19, 2001
> > > > >  * @see ServletContextAware#setServletContext
> > > > >  */
> > > > > public interface WebApplicationContext extends ApplicationContext {
> > > > > 
> > > > >    /**
> > > > >     * Context attribute to bind root WebApplicationContext to on successful startup.
> > > > >     * <p>Note: If the startup of the root context fails, this attribute can contain
> > > > >     * an exception or error as value. Use WebApplicationContextUtils for convenient
> > > > >     * lookup of the root WebApplicationContext.
> > > > >     * @see org.springframework.web.context.support.WebApplicationContextUtils#getWebApplicationContext
> > > > >     * @see org.springframework.web.context.support.WebApplicationContextUtils#getRequiredWebApplicationContext
> > > > >     */
> > > > >    String ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE = WebApplicationContext.class.getName() + ".ROOT";
> > > > > 
> > > > >    /**
> > > > >     * Scope identifier for request scope: "request".
> > > > >     * Supported in addition to the standard scopes "singleton" and "prototype".
> > > > >     */
> > > > >    String SCOPE_REQUEST = "request";
> > > > > 
> > > > >    /**
> > > > >     * Scope identifier for session scope: "session".
> > > > >     * Supported in addition to the standard scopes "singleton" and "prototype".
> > > > >     */
> > > > >    String SCOPE_SESSION = "session";
> > > > > 
> > > > >    /**
> > > > >     * Scope identifier for the global web application scope: "application".
> > > > >     * Supported in addition to the standard scopes "singleton" and "prototype".
> > > > >     */
> > > > >    String SCOPE_APPLICATION = "application";
> > > > > 
> > > > >    /**
> > > > >     * Name of the ServletContext environment bean in the factory.
> > > > >     * @see javax.servlet.ServletContext
> > > > >     */
> > > > >    String SERVLET_CONTEXT_BEAN_NAME = "servletContext";
> > > > > 
> > > > >    /**
> > > > >     * Name of the ServletContext init-params environment bean in the factory.
> > > > >     * <p>Note: Possibly merged with ServletConfig parameters.
> > > > >     * ServletConfig parameters override ServletContext parameters of the same name.
> > > > >     * @see javax.servlet.ServletContext#getInitParameterNames()
> > > > >     * @see javax.servlet.ServletContext#getInitParameter(String)
> > > > >     * @see javax.servlet.ServletConfig#getInitParameterNames()
> > > > >     * @see javax.servlet.ServletConfig#getInitParameter(String)
> > > > >     */
> > > > >    String CONTEXT_PARAMETERS_BEAN_NAME = "contextParameters";
> > > > > 
> > > > >    /**
> > > > >     * Name of the ServletContext attributes environment bean in the factory.
> > > > >     * @see javax.servlet.ServletContext#getAttributeNames()
> > > > >     * @see javax.servlet.ServletContext#getAttribute(String)
> > > > >     */
> > > > >    String CONTEXT_ATTRIBUTES_BEAN_NAME = "contextAttributes";
> > > > > 
> > > > > 
> > > > >    /** 
> > > > >     * Return the standard Servlet API ServletContext for this application. ！！！！！
> > > > >     */
> > > > >    @Nullable
> > > > >    ServletContext getServletContext();
> > > > > 
> > > > > }
> > > > > ```
> > > > >
> > > > > 主题资接口
> > > > >
> > > > > ```java
> > > > > package org.springframework.ui.context;
> > > > > 
> > > > > import org.springframework.lang.Nullable;
> > > > > 
> > > > > /**
> > > > >  * Interface to be implemented by objects that can resolve {@link Theme Themes}.
> > > > >  * This enables parameterization and internationalization of messages
> > > > >  * for a given 'theme'.
> > > > >  *
> > > > >  * @author Jean-Pierre Pawlak
> > > > >  * @author Juergen Hoeller
> > > > >  * @see Theme
> > > > >  */
> > > > > public interface ThemeSource {
> > > > > 
> > > > >    /**
> > > > >     * Return the Theme instance for the given theme name.
> > > > >     * <p>The returned Theme will resolve theme-specific messages, codes,
> > > > >     * file paths, etc (e.g. CSS and image files in a web environment).
> > > > >     * @param themeName the name of the theme
> > > > >     * @return the corresponding Theme, or {@code null} if none defined.
> > > > >     * Note that, by convention, a ThemeSource should at least be able to
> > > > >     * return a default Theme for the default theme name "theme" but may also
> > > > >     * return default Themes for other theme names.
> > > > >     * @see org.springframework.web.servlet.theme.AbstractThemeResolver#ORIGINAL_DEFAULT_THEME_NAME
> > > > >     */
> > > > >    @Nullable
> > > > >    Theme getTheme(String themeName);
> > > > > 
> > > > > }
> > > > > ```
> > > > >
> > > > > > ServletWebServerApplicationContext --> ConfigurableWebServerApplicationContext
> > > > > >
> > > > > > servle的webServerApplicationdContex实现ConfigurableWebServerApplicationContext接口,实现它后，可以获得管理 WebServer 的能力,使用springboot之后，我们不再需要配置web服务器，因为springboot帮我们集成了,
> > > > > >
> > > > > > ```java
> > > > > > package org.springframework.boot.web.context;
> > > > > > 
> > > > > > import org.springframework.context.ConfigurableApplicationContext;
> > > > > > 
> > > > > > /**
> > > > > >  * SPI interface to be implemented by most if not all {@link WebServerApplicationContext
> > > > > >  * web server application contexts}. Provides facilities to configure the context, in
> > > > > >  * addition to the methods in the {WebServerApplicationContext} interface.
> > > > > >  *
> > > > > >  * @author Phillip Webb
> > > > > >  * @since 2.0.0
> > > > > >  */
> > > > > > public interface ConfigurableWebServerApplicationContext
> > > > > >       extends ConfigurableApplicationContext, WebServerApplicationContext {
> > > > > > 
> > > > > >    /**
> > > > > >     * Set the server namespace of the context.
> > > > > >     * @param serverNamespace the server namespace
> > > > > >     * @see #getServerNamespace()
> > > > > >     */
> > > > > >    void setServerNamespace(String serverNamespace);
> > > > > > 
> > > > > > 
> > > > > > ```
> > > > > >
> > > > > > > AnnotationConfigServletWebServerApplicationContext --> AnnotationConfigRegistry
> > > > > > >
> > > > > > > 选择的注解配置注册器，该注册器具备注册多个组件(@component)的能力和扫描规定的基准包的能力
> > > > > > >
> > > > > > > ```java
> > > > > > > package org.springframework.context.annotation;
> > > > > > > 
> > > > > > > /**
> > > > > > >  * Common interface for annotation config application contexts,
> > > > > > >  * defining {@link #register} and {@link #scan} methods.
> > > > > > >  *
> > > > > > >  * @author Juergen Hoeller
> > > > > > >  * @since 4.1
> > > > > > >  */
> > > > > > > public interface AnnotationConfigRegistry {
> > > > > > > 
> > > > > > >    /**
> > > > > > >     * Register one or more component classes to be processed.
> > > > > > >     * <p>Calls to {@code register} are idempotent; adding the same 组件类的注册
> > > > > > >     * component class more than once has no additional effect.
> > > > > > >     * @param componentClasses one or more component classes,
> > > > > > >     * e.g. {@link Configuration @Configuration} classes
> > > > > > >     */
> > > > > > >    void register(Class<?>... componentClasses);
> > > > > > > 
> > > > > > >    /**
> > > > > > >     * Perform a scan within the specified base packages.
> > > > > > >     * @param basePackages the packages to scan for component classes
> > > > > > >     */
> > > > > > >    void scan(String... basePackages);
> > > > > > > 
> > > > > > > }
> > > > > > > ```

第一步：创建context 内部初始化注解式bean定义读取器 this.reader = new AnnotatedBeanDefinitionReader(this);

第二步：context设置启动指标 进行性能记录 context.setApplicationStartup(this.applicationStartup);

第三步：context环境准备 prepareContext(bootstrapContext, context, environment, listeners, applicationArguments, printedBanner);

1. 设置context环境

2. postProcessApplicationContext(ConfigurableApplicationContext context)

   applicationcontext后置处理，主要是给context父类们的相关需要的必要属性实例化

   + beanName生成器注册单利进context的beanFactory
   + 给父类通用applicaiocontext设置类加载器为当前的资源加载器
   + 给父类的默认资源加载器设置当前的类加载器
   + 给context的beanfactory设置转换服务

3. 对context遍历使用applicationcontext的初始化器

4. 给应用运行监听者们发布context准备事件

5. 启动器上下文关闭，并广播关闭事件

6. 打印context的日志信息，相关信息

7. 获取context的beanFactory，并注册单例springApplicationArguments

8. 注册单例springBootBanner、

9. 设置bean定义是否可以被覆盖

10. 添加beanfactory后置处理器 LazyInitializationBeanFactoryPostProcessor

11. 获取所有类资源

12. 准备加载所有bean定义。应用调用***load*** 这个成员方法

13. 创建bean定义加载器，需要context先生成bean定义注册器以提供createBeanDefinitionLoader(getBeanDefinitionRegistry(context), sources)

14. bean定义加载器设置beanName生成器、资源加载器、环境

15. 正式开始加载

16. 遍历所有类资源 包括主类

    ```java
    private void load(Object source) {
       Assert.notNull(source, "Source must not be null");
       if (source instanceof Class<?>) {
          load((Class<?>) source);
          return;
       }
       if (source instanceof Resource) {
          load((Resource) source);
          return;
       }
       if (source instanceof Package) {
          load((Package) source);
          return;
       }
       if (source instanceof CharSequence) {
          load((CharSequence) source);
          return;
       }
       throw new IllegalArgumentException("Invalid source type " + source.getClass());
    }
    ```

提供了四类方法，通过四种不同的途径进行加载bean定义

+ 类资源加载

  如果是groovy动态脚本语言的加载模式则另外生成相应的加载器去加载，不过这里我们采用的是注解式this.annotatedReader.register(source);我们只需要bean定义加载器内部的注解读取器对主类资源进行注册进入到bean定义注册表中

+ 其他的暂且不分析

```java
/**
 * Register a bean from the given bean class, deriving its metadata from
 * class-declared annotations.
 * @param beanClass the class of the bean
 * @param name an explicit name for the bean
 * @param qualifiers specific qualifier annotations to consider, if any,
 * in addition to qualifiers at the bean class level
 * @param supplier a callback for creating an instance of the bean
 * (may be {@code null})
 * @param customizers one or more callbacks for customizing the factory's
 * {@link BeanDefinition}, e.g. setting a lazy-init or primary flag
 * @since 5.0
 */
private <T> void doRegisterBean(Class<T> beanClass, @Nullable String name,
      @Nullable Class<? extends Annotation>[] qualifiers, @Nullable Supplier<T> supplier,
      @Nullable BeanDefinitionCustomizer[] customizers) {

  // 被注解的通用bean定义对象
   AnnotatedGenericBeanDefinition abd = new AnnotatedGenericBeanDefinition(beanClass);
   if (this.conditionEvaluator.shouldSkip(abd.getMetadata())) {
      return;
   }

   abd.setInstanceSupplier(supplier);
  // 解析该abd的绑定的元数据
   ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(abd);
   abd.setScope(scopeMetadata.getScopeName());
  // 生成一个beanName
   String beanName = (name != null ? name : this.beanNameGenerator.generateBeanName(abd, this.registry));

   AnnotationConfigUtils.processCommonDefinitionAnnotations(abd);
  // 空
   if (qualifiers != null) {
      for (Class<? extends Annotation> qualifier : qualifiers) {
         if (Primary.class == qualifier) {
            abd.setPrimary(true);
         }
         else if (Lazy.class == qualifier) {
            abd.setLazyInit(true);
         }
         else {
            abd.addQualifier(new AutowireCandidateQualifier(qualifier));
         }
      }
   }
   if (customizers != null) {
      for (BeanDefinitionCustomizer customizer : customizers) {
         customizer.customize(abd);
      }
   }
		// 创建bean定义持有者
   BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(abd, beanName);
   // 看是否需要被代理，代理则代理
   definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
  // 注册bean定义
   BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, this.registry);
}
```

注册bean定义的过程

```java
@Override
public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
      throws BeanDefinitionStoreException {

   Assert.hasText(beanName, "Bean name must not be empty");
   Assert.notNull(beanDefinition, "BeanDefinition must not be null");

   if (beanDefinition instanceof AbstractBeanDefinition) {
      try {
         ((AbstractBeanDefinition) beanDefinition).validate();
      }
      catch (BeanDefinitionValidationException ex) {
         throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
               "Validation of bean definition failed", ex);
      }
   }

   BeanDefinition existingDefinition = this.beanDefinitionMap.get(beanName);
   if (existingDefinition != null) {
      if (!isAllowBeanDefinitionOverriding()) {
         throw new BeanDefinitionOverrideException(beanName, beanDefinition, existingDefinition);
      }
      else if (existingDefinition.getRole() < beanDefinition.getRole()) {
         // e.g. was ROLE_APPLICATION, now overriding with ROLE_SUPPORT or ROLE_INFRASTRUCTURE
         if (logger.isInfoEnabled()) {
            logger.info("Overriding user-defined bean definition for bean '" + beanName +
                  "' with a framework-generated bean definition: replacing [" +
                  existingDefinition + "] with [" + beanDefinition + "]");
         }
      }
      else if (!beanDefinition.equals(existingDefinition)) {
         if (logger.isDebugEnabled()) {
            logger.debug("Overriding bean definition for bean '" + beanName +
                  "' with a different definition: replacing [" + existingDefinition +
                  "] with [" + beanDefinition + "]");
         }
      }
      else {
         if (logger.isTraceEnabled()) {
            logger.trace("Overriding bean definition for bean '" + beanName +
                  "' with an equivalent definition: replacing [" + existingDefinition +
                  "] with [" + beanDefinition + "]");
         }
      }
      this.beanDefinitionMap.put(beanName, beanDefinition);
   }
   else {  // 当不存在当前bean定义式
      if (hasBeanCreationStarted()) {  // 已经存在bean的创建已经开始了
         // Cannot modify startup-time collection elements anymore (for stable iteration)
         synchronized (this.beanDefinitionMap) {  // 锁住当前bean定义的map 这属于beanfactory
            this.beanDefinitionMap.put(beanName, beanDefinition);
            List<String> updatedDefinitions = new ArrayList<>(this.beanDefinitionNames.size() + 1);
            updatedDefinitions.addAll(this.beanDefinitionNames);
            updatedDefinitions.add(beanName);
            this.beanDefinitionNames = updatedDefinitions;
            removeManualSingletonName(beanNsame);
         }
      }
      else {
         // Still in startup registration phase
         this.beanDefinitionMap.put(beanName, beanDefinition);
         this.beanDefinitionNames.add(beanName);
         removeManualSingletonName(beanName);
      }
      this.frozenBeanDefinitionNames = null;
   }

   if (existingDefinition != null || containsSingleton(beanName)) {
      resetBeanDefinition(beanName);
   }
   else if (isConfigurationFrozen()) {
      clearByTypeCache();
   }
}
```

第四步：刷新context **applicationContext.refresh();**

1. 

### beanDefinition（bean定义的结构)

通用bean定义 parentName

| 类型                                         | 属性名                       | 值                  | 描述 |
| -------------------------------------------- | ---------------------------- | ------------------- | ---- |
| AttributeAccessorSupport                     |                              |                     |      |
| Map<String, Object>                          | attributes                   | new LinkedHashMap() |      |
| BeanMetadataAttributeAccessor                |                              |                     |      |
| Object                                       | source                       | Null                |      |
| AbstractBeanDefinition                       |                              |                     |      |
| String                                       | SCOPE_DEFAULT                | “”                  |      |
| Int                                          | AUTOWIRE_NO                  |                     |      |
| Int                                          | AUTOWIRE_BY_NAME             |                     |      |
| Int                                          | AUTOWIRE_BY_TYPE             |                     |      |
| Int                                          | AUTOWIRE_CONSTRUCTOR         |                     |      |
| Int                                          | AUTOWIRE_AUTODETECT          |                     |      |
| Int                                          | DEPENDENCY_CHECK_NONE        |                     |      |
| Int                                          | DEPENDENCY_CHECK_OBJECTS     |                     |      |
| Int                                          | DEPENDENCY_CHECK_SIMPLE      |                     |      |
| Int                                          | DEPENDENCY_CHECK_ALL         |                     |      |
| String                                       | INFER_METHOD                 | "(inferred)"        |      |
| volatile Object                              | beanClass                    |                     |      |
| String                                       | scope                        |                     |      |
| boolean                                      | abstractFlag                 |                     |      |
| Boolean                                      | lazyInit                     |                     |      |
| Int                                          | autowireMode                 |                     |      |
| Int                                          | dependencyCheck              |                     |      |
| String[]                                     | dependsOn                    |                     |      |
| boolean                                      | autowireCandidate            |                     |      |
| boolean                                      | primary;                     |                     |      |
| inal Map<String, AutowireCandidateQualifier> | qualifiers                   |                     |      |
| Supplier<?>                                  | instanceSupplier             |                     |      |
| boolean                                      | nonPublicAccessAllowed       |                     |      |
| boolean                                      | lenientConstructorResolution |                     |      |
| String                                       | factoryBeanName              |                     |      |
| String                                       | factoryMethodName            |                     |      |
| ConstructorArgumentValues                    | constructorArgumentValues    |                     |      |
| MutablePropertyValues                        | propertyValues               |                     |      |
| MethodOverrides                              | methodOverrides              |                     |      |
| String                                       | initMethodName               |                     |      |
| String                                       | destroyMethodName            |                     |      |
| boolean                                      | enforceInitMethod            |                     |      |
| boolean                                      | enforceDestroyMethod         |                     |      |
| boolean                                      | synthetic                    |                     |      |
| int                                          | role                         |                     |      |
| String                                       | description                  |                     |      |
| String                                       | resource                     |                     |      |
| GenericBeanDefinition                        |                              |                     |      |
| parentName                                   | parentName                   |                     |      |
| AnnotatedGenericBeanDefinition               |                              |                     |      |
| AnnotationMetadata                           | metadata                     |                     |      |
| MethodMetadata                               |                              |                     |      |
|                                              |                              |                     |      |
|                                              |                              |                     |      |



### 经典的spring工具类

#### org.springframework.util.Assert

#### org.springframework.util.ObjectUtils***常用***

#### org.springframework.util.NumberUtils

#### org.springframework.util.StringUtils***常用***

#### org.springframework.util.CollectionUtils***常用***

#### org.springframework.beans.BeanUtils***常用***

#### org.springframework.util.ClassUtils***常用***

> public static ClassLoader getDefaultClassLoader(); // 获取默认的类加载器

1. 由Thread.currentThread().getContextClassLoader()获取当前线程上下文类加载器，该方法由JDK提供，而当前线程上下文的类加载器是由创建该线程的创建者提供，如果没有设置，则默认使用其父线程的上下文的类加载器
2. 未获取到当前线程的类加载器，则采用当前工具类的类加载器
3. 当前类的类加载器也获取为null ,则采用系统类加载器ClassLoader.getSystemClassLoader() //JDK提供

**注意**线程上下文类加载器可以打破双亲委派机制，促使核心类可以访问扩展类，扩展类不在该类路径下，调用者类加载器是无法加载扩展类的。因此，springboot通过此方式提供SPI服务，让其他厂商实现springboot开放的接口。



#### org.springframework.context.annotation.AnnotationConfigUtils（spring注解底层发动机) **注解工具**

#### org.springframework.util.ReflectionUtils

#### org.springframework.util.function.SupplierUtils

#### org.springframework.util.FileCopyUtils

#### org.springframework.util.FileSystemUtils

#### org.springframework.util.StreamUtils

#### org.springframework.util.SerializationUtils

#### org.springframework.util.DigestUtils

#### org.springframework.util.Base64Utils

#### org.springframework.util.DomUtils

#### org.springframework.util.StopWatch

#### ResolvableType(优雅的获取泛型信息)



