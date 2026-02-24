export async function DisplayOrganizations() {
    const response = await fetch('http://localhost:3000/api/organizations');
    const organizations = await response.json();
    return (
        <div>
            {organizations.map((organization: any) => (
                <div key={organization.id}>
                    <h1>{organization.name}</h1>
                    <p>{organization.slug}</p>
                </div>
            ))}
        </div>
    );
}