import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import type { UserRole } from "@/lib/types";

export interface ManagedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active?: boolean;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string;
};

const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ManagedUser[], void>({
      query: () => "users/",
      providesTags: (users) => [
        { type: "User", id: "LIST" },
        ...(users ?? []).map(({ id }) => ({ type: "User" as const, id })),
      ],
    }),
    getUser: builder.query<ManagedUser, number>({
      query: (id) => `users/${id}/`,
      providesTags: (_user, _error, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation<ManagedUser, CreateUserPayload>({
      query: (body) => ({ url: "users/", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<ManagedUser, { id: number; data: UpdateUserPayload }>({
      query: ({ id, data }) => ({ url: `users/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_user, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = usersApi;
