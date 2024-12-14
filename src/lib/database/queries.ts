import { supabase } from '../supabase';
import { Database } from '../../types/database';
import { Todo, TodoList } from '../../types/todo';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type ListRow = Database['public']['Tables']['todo_lists']['Row'];

export const todoQueries = {
  async getTasks(userId: string): Promise<Todo[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapTaskRowToTodo);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return []; // Return empty array instead of throwing
    }
  },

  async createTask(task: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>): Promise<Todo> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return mapTaskRowToTodo(data);
  },

  async updateTask(taskId: string, updates: Partial<TaskRow>): Promise<Todo> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return mapTaskRowToTodo(data);
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

export const listQueries = {
  async getLists(userId: string): Promise<TodoList[]> {
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) throw error;
      return (data || []).map(mapListRowToTodoList);
    } catch (error) {
      console.error('Error fetching lists:', error);
      return []; // Return empty array instead of throwing
    }
  },

  async createList(list: Omit<ListRow, 'id' | 'created_at'>): Promise<TodoList> {
    const { data, error } = await supabase
      .from('todo_lists')
      .insert([list])
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
      throw error;
    }

    return mapListRowToTodoList(data);
  }
};

// Utility functions to map database rows to our frontend types
function mapTaskRowToTodo(row: TaskRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    priority: row.priority,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    category: row.category,
    recurring: row.recurring,
    subtasks: row.subtasks,
    notifications: row.notifications,
    user_id: row.user_id
  };
}

function mapListRowToTodoList(row: ListRow): TodoList {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    user_id: row.user_id
  };
}