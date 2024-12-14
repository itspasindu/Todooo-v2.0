import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Todo } from '../types/todo';
import { todoQueries } from '../lib/database/queries';

export function useTasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setError(null);
        const data = await todoQueries.getTasks(user.id);
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const addTask = useCallback(async (taskData: Partial<Todo>) => {
    if (!user) return;

    try {
      setError(null);
      const newTask = await todoQueries.createTask({
        ...taskData,
        user_id: user.id,
        completed: false,
      } as any);
      setTasks((current) => [newTask, ...current]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task. Please try again.');
      throw err;
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Todo>) => {
    if (!user) return;

    try {
      setError(null);
      const updatedTask = await todoQueries.updateTask(taskId, updates as any);
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
      throw err;
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    try {
      setError(null);
      await todoQueries.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
      throw err;
    }
  }, [user]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, { completed: !task.completed });
  }, [tasks, updateTask]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    await updateTask(taskId, { subtasks: updatedSubtasks });
  }, [tasks, updateTask]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleSubtask,
  };
}