from transformers import TrainingArguments, AutoModelForSequenceClassification, Trainer
import evaluate
import numpy as np

# 用于在评估过程中计算模型的性能指标
def compute_metrics(eval_preds):
    metric = evaluate.load("glue", "mrpc")
    logits, labels = eval_preds
    predictions = np.argmax(logits, axis=-1)
    return metric.compute(predictions=predictions, references=labels)

# 定义模型
training_args = TrainingArguments("test-trainer", evaluation_strategy="epoch")
model = AutoModelForSequenceClassification.from_pretrained(checkpoint, num_labels=2)

# 创建 Trainer
trainer = Trainer(
    model,
    training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["validation"],
    data_collator=data_collator,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)
trainer.train()



![img](https://i-blog.csdnimg.cn/direct/13f31c3e9139460ba18f254e58bbe63a.png)

model.print_trainable_parameters()



import evaluate
import numpy as np
from datasets import load_from_disk
from tqdm import tqdm

\# Metric
metric = evaluate.load("rouge")

def evaluate_peft_model(sample,max_target_length=50):
    \# generate summary
    outputs = model.generate(input_ids=sample["input_ids"].unsqueeze(0).cuda(), do_sample=True, top_p=0.9, max_new_tokens=max_target_length)
    prediction = tokenizer.decode(outputs[0].detach().cpu().numpy(), skip_special_tokens=True)
    \# decode eval sample
    \# Replace -100 in the labels as we can't decode them.
    labels = np.where(sample['labels']!= -100, sample['labels'], tokenizer.pad_token_id)
    labels = tokenizer.decode(labels, skip_special_tokens=True)

​    \# Some simple post-processing
​    return prediction, labels

\# load test dataset from distk
test_dataset = load_from_disk("data/eval/").with_format("torch")

\# run predictions
\# this can take ~45 minutes
predictions, references = [], []
for sample in tqdm(test_dataset):
    p,l = evaluate_peft_model(sample)
    predictions.append(p)
    references.append(l)

\# compute metric
rogue = metric.compute(predictions=predictions, references=references, use_stemmer=True)

\# print results
print(f"Rogue1: {rogue['rouge1']* 100:2f}%")
print(f"rouge2: {rogue['rouge2']* 100:2f}%")
print(f"rougeL: {rogue['rougeL']* 100:2f}%")
print(f"rougeLsum: {rogue['rougeLsum']* 100:2f}%")

\# Rogue1: 50.386161%
\# rouge2: 24.842412%
\# rougeL: 41.370130%
\# rougeLsum: 41.394230%