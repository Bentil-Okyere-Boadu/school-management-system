const config = () => {
    const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || '';

    return {
        apiURL: apiUrl,
    }
}

export default config