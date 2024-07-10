// Lớp này giúp quản lý thông tin người dùng trong localStorage

// Lấy ra tên người dùng hiện tại trong localStorage
export const getCurrentUser = () => {
    return localStorage.getItem('user');
};

// Lưu tên người dùng vào localStorage khi người dùng đăng nhập
export const setCurrentUser = (user: string) => {
    localStorage.setItem('user', user);
};


// Xóa tên người dùng ra khỏi LS
export const removeCurrentUser = () => {
    localStorage.removeItem('user');
};