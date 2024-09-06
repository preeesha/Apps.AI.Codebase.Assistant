export type DevDocDBNodeRelationType = "CONTAINS"
export type DevDocDBNodeRelation = {
	target: string
	relation: DevDocDBNodeRelationType
}

export type DevDocDBNode = {
	id: string
	relations: DevDocDBNodeRelation[]

	element: string

	content: string
	contentEmbeddings: number[]
}
