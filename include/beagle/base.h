#ifndef BEAGLE_BASE_H
#define BEAGLE_BASE_H


#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>


#if defined(WIN32) || defined(_WIN32)
    #define __WINDOWS__
#else
    #define __UNIX__
#endif


#if defined(__WINDOWS__) || defined(_MSC_VER)
    #define BGL_PRIVATE
    #define BGL_PUBLIC
    #ifdef __cplusplus
        #define BGL_LIB_EXPORT  extern "C" __declspec(dllexport)
    #else
        #define BGL_LIB_EXPORT  extern __declspec(dllexport)
    #endif
    #define BGL_LIB_IMPORT  extern __declspec(dllimport)
#else
    #define BGL_PRIVATE  __attribute__((visibility("hidden")))
    #define BGL_PUBLIC  __attribute__((visibility("default")))
    #ifdef __cplusplus
        #define BGL_LIB_EXPORT  extern "C" BGL_PUBLIC
    #else
        #define BGL_LIB_EXPORT  extern BGL_PUBLIC
    #endif
    #define BGL_LIB_IMPORT extern
#endif


#ifndef __WINDOWS__
    #define BGL_FUNCTION(type, name)   type __fastcall name
#else
    #define BGL_FUNCTION(type, name)   type name
#endif


#define BGL_NULL (void*)0
#ifndef BGL_TRUE
    #define BGL_TRUE (uint8_t)1
#endif
#ifndef BGL_FALSE
    #define BGL_FALSE (uint8_t)0
#endif

typedef uint8_t  beagle_uint8;
typedef uint16_t beagle_uint16;
typedef uint32_t beagle_uint32;
typedef uint64_t beagle_uint64;
typedef int8_t   beagle_int8;
typedef int16_t  beagle_int16;
typedef int32_t  beagle_int32;
typedef int64_t  beagle_int64;
typedef float    beagle_float32;
typedef double   beagle_float64;
typedef uint8_t  beagle_bool;


/*
 * Reference counting
 */

#ifndef BEAGLE_MALLOC
#define BEAGLE_MALLOC malloc
#else
void *BEAGLE_MALLOC(size_t);
#endif

#ifndef BEAGLE_FREE
#define BEAGLE_FREE free
#else
void BEAGLE_FREE(void*);
#endif

#define BEAGLE_REFINC(x) \
    do{ __sync_add_and_fetch(&((x)->refc), 1); } while(0)

#define BEAGLE_REFDEC(x) \
    do{ if (__sync_sub_and_fetch(&((x)->refc), 1) == 0) { \
        (x)->dtor(x); BEAGLE_FREE(x); } } while(0)


/*
 * Type definition
 */

struct typeinfo_
{
	struct typeinfo_ *base; // pointer to base class/struct type info (NULL = no base)
	size_t staticSize;
	size_t dynamicSize;
	const char *nameU8;
    const uint16_t *nameU16;
};


/**
 * String class
 */
struct static_string_
{
   void *base__;
   struct typeinfo_ typeInfo__;
};

struct dynamic_string_
{
	struct static_string_ *type__;
	uint32_t length;
	const char *content;
};


static const uint16_t string_name_u16_[] = { 0x0073, 0x0074, 0x0072, 0x0069, 0x006e, 0x0067 };

static struct static_string_ type_string_ =
{
   .typeInfo__.base = NULL,
   .typeInfo__.staticSize = sizeof(struct static_string_),
   .typeInfo__.dynamicSize = sizeof(struct dynamic_string_),
   .typeInfo__.nameU8 = "string",
   .typeInfo__.nameU16 = string_name_u16_,
   .base__ = NULL
};

typedef const struct dynamic_string_ *beagle_string;


typedef struct beagle_frame
{
    struct beagle_frame* prev;
    const char *function;
    const char *fileName;
    uint32_t line;
    uint32_t depth;
    uint32_t size;
    uint8_t content[];
} beagle_frame;

#endif // BEAGLE_BASE_H
