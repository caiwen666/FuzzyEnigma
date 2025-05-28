use std::{
    cmp::Ordering,
    collections::{BinaryHeap, HashMap},
};

use crate::entity::task::Task;

struct WeightWrapper<T> {
    deadline: u64, // 截止时间小的先做
    weight: u32,   // 权重小的先做
    inner: T,
}

impl<T> PartialEq for WeightWrapper<T> {
    fn eq(&self, other: &Self) -> bool {
        self.weight == other.weight && self.weight == other.weight
    }
}

impl<T> Eq for WeightWrapper<T> {}

impl<T> Ord for WeightWrapper<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.deadline == other.deadline {
            other.weight.cmp(&self.weight)
        } else {
            other.deadline.cmp(&self.deadline)
        }
    }
}

impl<T> PartialOrd for WeightWrapper<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl WeightWrapper<(Task, bool)> {
    fn new(task: Task, finish: bool) -> Self {
        Self {
            deadline: task.info.deadline,
            weight: task.info.cost / (u32::from(task.info.priority) + 1),
            inner: (task, finish),
        }
    }
}

pub async fn arrange_task(list: Vec<(Task, bool)>) -> Vec<(Task, bool)> {
    let mut deg = HashMap::new(); // 每个点的入度
    let mut tasks = HashMap::new(); // 根据编号获得任务实体
    let mut que = BinaryHeap::new(); // 优先队列
    let mut g = HashMap::new(); // 邻接表
    let mut res = Vec::new(); // 结果
    for (task, finish) in list {
        if let Some(prev) = task.prev {
            g.entry(prev).or_insert(vec![]).push(task.id);
            *deg.entry(task.id).or_insert(0) += 1;
        } else {
            que.push(WeightWrapper {
                deadline: task.info.deadline,
                weight: task.info.cost / (u32::from(task.info.priority) + 1),
                inner: (task.clone(), finish),
            });
        }
        tasks.insert(task.id, (task, finish));
    }
    while let Some(WeightWrapper {
        deadline: _,
        weight: _,
        inner: (task, finish),
    }) = que.pop()
    {
        if let Some(next_tasks) = g.get(&task.id) {
            for next_id in next_tasks {
                let next_deg = deg.get_mut(next_id).unwrap();
                *next_deg -= 1;
                if *next_deg == 0 {
                    let (next_task, next_task_finish) = tasks.remove(next_id).unwrap();
                    que.push(WeightWrapper::new(next_task, next_task_finish));
                }
            }
        }
        res.push((task, finish));
    }
    res
}
