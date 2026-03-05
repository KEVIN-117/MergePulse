"use server";

/*
return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        githubUsername: user.githubUsername,
        organizationId: user.organizationId,
        role: user.role,
      },
    };
*/

interface AuthResponse {
    accessToken: string;
    tokenType: string;
    user: {
        id: string;
        githubUsername: string;
        organizationId: string;
        role: string;
    };
}

export async function login() {
    // http://localhost:3000/api/auth/github/login
    const response = await fetch("http://localhost:3000/api/auth/github/login");

    // response is html page with login form
    // redirect to login page
    if (response.status === 302) {
        window.location.href = response.headers.get("Location") as string;
    }

    // const data = await response.json() as AuthResponse;
    // localStorage.setItem("accessToken", data.accessToken);
    // localStorage.setItem("user", JSON.stringify(data.user));

    return response;
}
