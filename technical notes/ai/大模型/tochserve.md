# torch serve 实战

> ## 需求
>
> 将由两个onnx模型串起来的workflow部署至TorchServe（TS）框架。
>
> 不采用简单的fastapi + pytorch的原因：
>
> - *需自行实现batching 功能*
> - 需自行实现模型管理功能
> - 
>
> ------
>
> ## Torch Serve简介（by bing）
>
> > Torch Serve是一个能够打包所有模型文件成一个单一模型文件的工具，这个模型文件可以被任何使用TorchServe的人重新分发和使用。它有一个独立的命令行界面（CLI），torch-model-archiver，可以将模型检查点或带有state_dict的模型定义文件打包成一个.mar文件。这个文件可以被任何使用TorchServe的人重新分发和使用。它接受以下模型文件：torchscript中的模型检查点文件或急切模式中的模型定义文件和state_dict文件，以及可能需要用于服务模型的其他可选资产。CLI创建了一个.mar文件，TorchServe的服务器CLI使用它来服务模型。
> > Torch Serve是PyTorch生态系统中的一部分，是一个开源框架，用于快速部署PyTorch模型。它提供了一个高度可扩展且易于使用的平台，用于将训练好的PyTorch模型部署到生产环境中。它支持多种部署选项，包括RESTful API、gRPC和Amazon SageMaker等。
> > 如果您想了解更多关于Torch Serve的信息，请访问[https://pytorch.org/serve/](https://link.zhihu.com/?target=https%3A//pytorch.org/serve/)。
>
> ## 开发流程
>
> 1. 环境安装
> 2. 确定数据流，设计DAG，编写work flow配置文件
> 3. 编写DAG中每个节点的数据处理handler
> 4. 将所有的handler以及相关文件、依赖打包
> 5. 编写ts-config文件：config.properties
> 6. 启动服务
> 7. 确认
>
> ## 环境安装（非docker）
>
> ### PIP
>
> ```text
> # Install dependencies
> # cuda is optional
> python ./ts_scripts/install_dependencies.py --cuda=cu102
> 
> # Latest release
> pip install torchserve torch-model-archiver torch-workflow-archiver
> 
> # Nightly build
> pip install torchserve-nightly torch-model-archiver-nightly torch-workflow-archiver-nightly
> ```
>
> ### CONDA
>
> ```text
> # Install dependencies
> # cuda is optional
> python ./ts_scripts/install_dependencies.py --cuda=cu102
> 
> # Latest release
> conda install -c pytorch torchserve torch-model-archiver torch-workflow-archiver
> 
> # Nightly build
> conda install -c pytorch-nightly torchserve torch-model-archiver torch-workflow-archiver
> ```
>
> ### 经验
>
> 实测cuda版本号11.x基本可以用最新的11.x版本的TS，不用太在意小版本号。
>
> ## 确定数据流，设计DAG，编写work flow配置文件
>
> 该配置文件为YAML格式，主要包括两个部分，模型配置和DAG，示例如下：
>
> ```text
> models:
>     # 全局模型参数
>     min-workers: 1
>     max-workers: 1
>     batch-size: 4
>     max-batch-delay: 100
>     retry-attempts: 5
>     timeout-ms: 300000
> 
>     detection:
>       url: det_onnx.mar
> 
>     recognition:
>         # 模型参数会覆盖全局参数
>         min-workers: 4
>         max-workers: 4
>         batch-size: 4
>         max-batch-delay: 100
>         retry-attempts: 5
>       url: rec_onnx.mar
> 
> dag:
>   pre_processing: [detection, recognition]
>   detection: [recognition]
> ```
>
> models字段下的选项为通用参数，每个模型下可以设置特定的参数，模型的参数值会覆盖通用选项值。
>
> DAG字段下，每个key为一个DAG节点，其值为下一节点的列表。其中，节点名称为models下的模型名称，另外，work flow handler下也可定义函数型的几点，例如此处的pre_processing节点。
>
> 该dag定义了一个如下的图：
>
> ```text
>                  detection
>                 /         \
> pre_processing ->---------->recognition
> ```
>
> 即，pre_processing对数据进行预处理，之后输出分别送到detection和recognition模型，detection模型获得数据并处理完成后，将结果送到recognition模型，recognition模型接收到上述连个输入后，进行计算，返回最终结果。
>
> ## Handler
>
> 部署的主要工作是编写handler，实现模型所需的预处理与后处理工作。Handler一般可以继承自ts.torch_handler.base_handler.BaseHandler。该类定义如下：
>
> ```text
> class BaseHandler(abc.ABC):
>     """
>     Base default handler to load torchscript or eager mode [state_dict] models
>     Also, provides handle method per torch serve custom model specification
>     """
> 
>     def __init__(self):
> 
> 
>     def initialize(self, context):
>         """初始化模型，自动识别模型类别，使用pytorch或者onnx来实例化模型。
> 
>         Args:
>             context (context): It is a JSON Object containing information
>             pertaining to the model artifacts parameters.
> 
>         """
>         ...
>         self.initialized = True
> 
>     def preprocess(self, data):
>         """
>         预处理函数，可自定义
> 
>         Args :
>             data (list): List of the data from the request input.
>         """
> 
>     def inference(self, data, *args, **kwargs):
>         """
>         推理，可自定义
> 
>         Args:
>             data (Torch Tensor): A Torch Tensor is passed to make the Inference Request.
>             The shape should match the model input shape.
> 
>         """
> 
> 
>     def postprocess(self, data):
>         """
>         后处理，可自定义
> 
>         Args:
>             data (Torch Tensor): The torch tensor received from the prediction output of the model.
> 
>         Returns:
>             List: The post process function returns a list of the predicted output.
>         """
> 
> 
>     def handle(self, data, context):
>         """
>         TS框架调用Handler的接口，可自定义
> 
>         Args:
>             data (list): The input data that needs to be made a prediction request on.
>             context (Context): It is a JSON Object containing information pertaining to
>                                the model artefacts parameters.
> 
>         Returns:
>             list : Returns a list of dictionary with the predicted response.
>         """
> 
>         return output
> 
>     ...
> ```
>
> ### handle(data, context)
>
> data为节点的前置节点输出的数据，其格式为：
>
> ```text
> [{
>     $last_node_name_1: data1, # data为二进制数据
>     $last_node_name_2: data2,
>     ...
> }]
> ```
>
> 若前置节点只有一个，则为：
>
> ```text
> [{
>     "body": data, # data为二进制数据
> }]
> ```
>
> 以本项目为例，pre_processing接收用户上传的图片，之后将其进行base64编码后输出：
>
> ```text
> base64.b64encode(input_data).decode()
> ```
>
> detection处理图片，检测出ROI，并输出ndarray：
>
> ```text
> data = io.BytesIO()
> response = []
> for dt in ROI_boxes:
>     np.save(data, dt)
>     response.append(data.getvalue())
> return response
> ```
>
> recognition接收前两个节点的输出：
>
> ```text
> for row in data:
>     img = np.asarray(Image.open(io.BytesIO(base64.b64decode(row['pre_processing']))))
>     dt_list = np.load(io.BytesIO(row.get('detection')))
> ...
> ```
>
> *重点：handle()返回的必须是 list ！！*
>
> *work flow的handler可为空，但文件必须要有，否则无法打包。*
>
> ## 打包
>
> 打包的过程是把所有模型以及本地依赖文件打包的一个单独的文档中。模型的打包工具为torch-model-archiver [官方文档](https://link.zhihu.com/?target=https%3A//github.com/pytorch/serve/tree/master/model-archiver%23torch-model-archiver-for-torchserve)。workflow的打包工具为torch-workflow-archiver[官方文档](https://link.zhihu.com/?target=https%3A//github.com/pytorch/serve/blob/master/workflow-archiver/README.md)
>
> ### torch-model-archiver
>
> ```text
> $ torch-model-archiver -h
> usage: torch-model-archiver [-h] --model-name MODEL_NAME  --version MODEL_VERSION_NUMBER
>                       --model-file MODEL_FILE_PATH --serialized-file MODEL_SERIALIZED_PATH
>                       --handler HANDLER [--runtime {python,python3}]
>                       [--export-path EXPORT_PATH] [-f] [--requirements-file] [--config-file]
> 
> Model Archiver Tool
> 
> optional arguments:
>   -h, --help            show this help message and exit
>   --model-name MODEL_NAME
>                         导出的模型名称。如果未指定–export-path，则导出的文件将命名为model-name.mar并保存在当前工作目录中，否则将保存在导出路径下。
>   --serialized-file SERIALIZED_FILE
>                         路径指向包含状态字典的.pt或.pth文件，如果是eager模式；或指向可执行的ScriptModule，如果是TorchScript模式。
>   --model-file MODEL_FILE
>                         Python文件的路径，其中包含模型架构。
>                         对于eager模式的模型，此参数是必需的。
>                         模型架构文件必须仅包含一个扩展自torch.nn.Module的类定义。
>   --handler HANDLER     TorchServe的默认处理程序名称或处理程序Python文件路径，用于处理自定义的TorchServe推理逻辑。
>   --extra-files EXTRA_FILES
>                         逗号分隔的额外依赖文件路径。
>   --runtime {python,python3}
>                         运行时指定您的推断代码要在哪种语言上运行。默认的运行时类型是RuntimeType.PYTHON。目前，我们支持以下运行时：python，python3。
>   --export-path EXPORT_PATH
>                         导出 .mar 文件保存的路径。这是一个可选参数。如果未指定 --export-path，则文件将保存在当前工作目录中。
>   --archive-format {tgz, no-archive, zip-store, default}
>                         模型工件存档的格式。
>                         "tgz"：这将创建以<model-name>.tar.gz格式的模型存档。如果托管平台需要模型工件以“.tar.gz”格式，则使用此选项。
>                         "no-archive"：此选项在“export-path/{model-name}”位置创建一个非归档版本的模型工件。由于选择此选项，MANIFEST文件将在“export-path/{model-name}”位置创建，而不会对这些模型文件进行归档。
>                         "zip-store"：这将以<model-name>.mar格式创建模型存档，但将跳过解压缩文件以加快创建速度。主要用于测试目的。
>                         "default"：这将以<model-name>.mar格式创建模型存档。这是默认的存档格式。以此格式存档的模型将可以立即在TorchServe上托管。
>   -f, --force           当指定了-f或--force标志时，将覆盖在--export-path指定的路径中，与--model-name提供的同名的现有.mr文件。
>   -v, --version         模型的版本
>   -r, --requirements-file
>                         要求.txt文件路径，其中包含一个模型特定的Python包列表，由TorchServe安装以实现无缝的模型服务。
>   -c, --config-file     模型配置yaml文件的路径。
> ```
>
> 本项目中，我们采用了如下的命令进行打包：
>
> ```text
> torch-model-archiver -f --model-name det_onnx \
>                     --version 1.0 \
>                     --serialized-file \
>                     det_runtime/model.onnx \
>                     --export-path models \
>                     --handler det_handler.py \
>                     --extra-files image_utils.py,ocr_reader.py,functional.py
> torch-model-archiver -f --model-name rec_onnx \
>                     --version 1.0 \
>                     --serialized-file rec_runtime/model.onnx \
>                     --export-path models \
>                     --handler rec_handler.py \
>                     --extra-files image_utils.py,ocr_reader.py,functional.py,vocab.txt
> ```
>
> 其中额外的几个依赖文件需要利用`--extra-files`打包进去。
>
> ### torch-workflow-archiver
>
> ```text
> $ torch-workflow-archiver -h
> usage: torch-workflow-archiver [-h] --workflow-name WORKFLOW_NAME --spec-file WORKFLOW_SPECIFICATION_FILE_PATH
>                       [--handler HANDLER] [--export-path EXPORT_PATH] [-f]
> 
> Workflow Archiver Tool
> 
> optional arguments:
>   -h, --help            show this help message and exit
>   --workflow-name WORKFLOW_NAME
>                         导出工作流名称。如果没有指定 --export-path，则导出的文件将命名为 workflow-name.war 并保存在当前工作目录中，否则将保存在导出路径下。
>   --spec-file WORKFLOW_SPECIFICATION_FILE_PATH
>                         .yaml文件路径，其中包含工作流DAG规范。
>   --handler HANDLER     Python文件的路径，其中包含工作流的前处理和后处理逻辑。
>   --export-path EXPORT_PATH
>                         导出.war文件保存的路径。这是一个可选参数。如果未指定--export-path参数，则文件将保存在当前工作目录中。
>   -f, --force           当指定 -f 或 --force 标志时，将会覆盖指定 --workflow-name 中提供的同名 .war 文件，位于 --export-path 指定的路径中。
>   --extra-files EXTRA_FILES
>                         逗号分隔的额外依赖文件路径。
> ```
>
> 本项目工作流打包采用的命令为：
>
> ```text
> torch-workflow-archiver -f --workflow-name ocr --spec-file ocr_workflow.yml --handler ocr_handler.py --export-path workflow/
> ```
>
> ## config.properties
>
> TorchServe使用一个config.properties文件来存储配置信息[官方文档](https://link.zhihu.com/?target=https%3A//pytorch.org/serve/configuration.html)。
>
> > TorchServe按以下优先顺序使用以下方式来定位这个config.properties文件： 如果设置了TS_CONFIG_FILE环境变量，TorchServe将从环境变量指定的路径加载配置。 如果向torchserve传递了--ts-config参数，TorchServe将从参数指定的路径加载配置。 如果在调用torchserve的文件夹中存在config.properties文件，则TorchServe将从当前工作目录加载config.properties文件。 如果没有指定上述任何一项，则TorchServe将加载具有默认值的内置配置。
>
> 本项目中采用的config主要为：
>
> ```text
> default_response_timeout=300
> unregister_model_timeout=300
> install_py_dep_per_model=true
> inference_address=http://0.0.0.0:8443
> management_address=http://0.0.0.0:8444
> metrics_address=http://0.0.0.0:8445
> ```
>
> ## 运行服务：torchserve
>
> [官方文档](https://link.zhihu.com/?target=https%3A//pytorch.org/serve/server.html)
>
> 命令的参数为：
>
> ```text
> $ torchserve --help
> usage: torchserve [-h] [-v | --version]
>                           [--start]
>                           [--stop]
>                           [--ts-config TS_CONFIG]
>                           [--model-store MODEL_STORE]
>                           [--workflow-store WORKFLOW_STORE]
>                           [--models MODEL_PATH1 MODEL_NAME=MODEL_PATH2... [MODEL_PATH1 MODEL_NAME=MODEL_PATH2... ...]]
>                           [--log-config LOG_CONFIG]
> 
> torchserve
> 
> optional arguments:
>   -h, --help            show this help message and exit
>   -v, --version         Return TorchServe Version
>   --start               Start the model-server
>   --stop                Stop the model-server
>   --ts-config TS_CONFIG
>                         Configuration file for TorchServe
>   --model-store         MODEL_STORE
>                         模型存储位置，可以加载模型。
>                         如果config.properties中未定义“model_store”，则需要它。
>   --models MODEL_PATH1 MODEL_NAME=MODEL_PATH2... [MODEL_PATH1 MODEL_NAME=MODEL_PATH2... ...]
>                         模型应使用[model_name=]model_location格式进行加载。位置可以是HTTP URL，模型归档文件，或包含模型归档文件的目录位于MODEL_STORE中。
>   --log-config LOG_CONFIG
>                         Log4j configuration file for TorchServe
>   --ncs, --no-config-snapshots         
>                         Disable snapshot feature
>                         TorchServe 保留服务器运行时配置，使得当 TorchServe 实例遇到计划或非计划的服务停止时，可以在重新启动时恢复其状态。
>   --workflow-store WORKFLOW_STORE
>                         工作流存储位置，可以在此处加载工作流。默认为model-store。
> ```
>
> 本项目启动采用的命令为：
>
> ```text
> # 由于当前snapshots不支持工作流，需要添加--ncs选项。
> torchserve --start --model-store models/ --workflow-store workflow/ --ncs
> ```
>
> 加载model_store中所有可用模型的示例：
>
> ```text
> torchserve --start --model-store /models --models all
> ```
>
> 指定多模型示例：
>
> ```text
> torchserve --start --model-store /models --models name=model_location name2=model_location2
> # 使用本地模型文件运行ResNet-18和VGG16模型的示例。
> torchserve --start --model-store /models --models resnet-18=resnet-18.mar squeezenet=squeezenet_v1.1.mar
> ```
>
> ## 推理API
>
> 模型上线后，需要先注册，之后再执行推理。
>
> [官方文档](https://link.zhihu.com/?target=https%3A//pytorch.org/serve/inference_api.html)
>
> 注册
>
> ```text
> # for workflow
> curl -X POST "http://127.0.0.1:8081/workflows?url=ocr.war"
> # for model
> curl -X POST  "http://localhost:8081/models?url=https://torchserve.pytorch.org/mar_files/squeezenet1_1.mar"
> ```
>
> 推理
>
> ```text
> curl http://127.0.0.1:8080/wfpredict/ocr -T test.jpg
> ```